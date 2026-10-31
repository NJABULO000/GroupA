import { Router } from 'express'
import { eq, inArray, sql } from 'drizzle-orm'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth.js'
import { db } from '../db/index.js'
import {
  menuItems,
  extras,
  reservations,
  reservationItems,
  reservationItemExtras,
} from '../db/schema.js'
import {
  CAPACITY,
  isValidDate,
  todayString,
  nowMinutes,
  slotsForDate,
  formatTime,
  seatsLeft,
} from '../lib/capacity.js'

// An error that carries the HTTP status code to send back
class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

const router = Router()

// POST /api/reservations
router.post('/', async (req, res, next) => {
  try {
    // 1. Only signed-in users can book
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) throw new HttpError(401, 'Please sign in to book a table')

    // 2. Validate everything the browser sent
    const { date, startMinutes, guests, items = [] } = req.body ?? {}

    if (typeof date !== 'string' || !isValidDate(date)) {
      throw new HttpError(400, 'Please choose a valid date')
    }
    const today = todayString()
    if (date < today) throw new HttpError(400, 'That date has already passed')
    if (!Number.isInteger(startMinutes) || !slotsForDate(date).includes(startMinutes)) {
      throw new HttpError(400, 'Please choose a valid time')
    }
    if (date === today && startMinutes <= nowMinutes()) {
      throw new HttpError(400, 'That time has already passed')
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > CAPACITY) {
      throw new HttpError(400, `Guests must be between 1 and ${CAPACITY}`)
    }
    if (!Array.isArray(items) || items.length > 30) {
      throw new HttpError(400, 'Invalid order')
    }
    for (const line of items) {
      const extraIds = line?.extraIds ?? []
      if (
        !Number.isInteger(line?.menuItemId) ||
        !Number.isInteger(line?.quantity) ||
        line.quantity < 1 ||
        line.quantity > 20 ||
        !Array.isArray(extraIds) ||
        !extraIds.every(Number.isInteger)
      ) {
        throw new HttpError(400, 'Invalid order line')
      }
    }

    // 3. Look up the REAL prices. The browser sends only ids, never prices.
    const menuIds = [...new Set(items.map((l) => l.menuItemId))]
    const extraIdList = [...new Set(items.flatMap((l) => l.extraIds ?? []))]

    const menuRows = menuIds.length
      ? await db.select().from(menuItems).where(inArray(menuItems.id, menuIds))
      : []
    const extraRows = extraIdList.length
      ? await db.select().from(extras).where(inArray(extras.id, extraIdList))
      : []
    const menuById = new Map(menuRows.map((m) => [m.id, m]))
    const extraById = new Map(extraRows.map((e) => [e.id, e]))

    let total = 0
    const lines = items.map((line) => {
      const dish = menuById.get(line.menuItemId)
      if (!dish) throw new HttpError(400, 'One of the dishes does not exist')

      const chosen = [...new Set(line.extraIds ?? [])].map((id) => {
        const extra = extraById.get(id)
        if (!extra || extra.category !== dish.category) {
          throw new HttpError(400, `Invalid extra for ${dish.name}`)
        }
        return extra
      })

      const unit = dish.priceCents + chosen.reduce((sum, e) => sum + e.priceCents, 0)
      total += unit * line.quantity
      return { dish, quantity: line.quantity, extras: chosen }
    })

    // 4. Check capacity and save, as ONE all-or-nothing transaction
    const created = await db.transaction(async (tx) => {
      // Lock this date: only one booking at a time can be checked and saved
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${date}::text))`)

      const booked = await tx
        .select({ startMinutes: reservations.startMinutes, guests: reservations.guests })
        .from(reservations)
        .where(eq(reservations.reservationDate, date))

      const left = seatsLeft(booked, startMinutes)
      if (guests > left) {
        throw new HttpError(
          409,
          left === 0 ? 'That time is fully booked' : `Only ${left} seats left at that time`,
          { seatsLeft: left },
        )
      }

      const [reservation] = await tx
        .insert(reservations)
        .values({
          userId: session.user.id,
          reservationDate: date,
          startMinutes,
          guests,
          totalCents: total,
        })
        .returning()

      for (const line of lines) {
        const [item] = await tx
          .insert(reservationItems)
          .values({
            reservationId: reservation.id,
            menuItemId: line.dish.id,
            quantity: line.quantity,
            unitPriceCents: line.dish.priceCents,
          })
          .returning({ id: reservationItems.id })

        if (line.extras.length > 0) {
          await tx.insert(reservationItemExtras).values(
            line.extras.map((e) => ({
              reservationItemId: item.id,
              extraId: e.id,
              priceCents: e.priceCents,
            })),
          )
        }
      }

      return reservation
    })

    res.status(201).json({
      id: created.id,
      date,
      startMinutes,
      time: formatTime(startMinutes),
      guests,
      totalCents: total,
    })
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, ...err.extra })
    }
    next(err)
  }
})

export default router