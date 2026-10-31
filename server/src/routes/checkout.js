import { Router } from 'express'
import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  menuItems,
  extras,
  reservations,
  reservationItems,
  reservationItemExtras,
  orders,
  orderItems,
} from '../db/schema.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { HttpError } from '../lib/errors.js'
import { stripe, CURRENCY, DEPOSIT_PER_GUEST_CENTS, HOLD_MINUTES } from '../lib/stripe.js'
import { activeBookings } from '../lib/bookings.js'
import {
  CAPACITY,
  isValidDate,
  todayString,
  nowMinutes,
  slotsForDate,
  formatTime,
  seatsLeft,
} from '../lib/capacity.js'

const router = Router()

// POST /api/checkout: signed-in users only
router.post('/', requireAuth, async (req, res, next) => {
  try {
    // 1. Validate everything the browser sent
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

    // 2. Real prices for the optional pre-order (paid at the table)
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

    let preorderCents = 0
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
      preorderCents += unit * line.quantity
      return { dish, quantity: line.quantity, extras: chosen }
    })

    // The deposit is decided here, never by the browser
    const depositCents = guests * DEPOSIT_PER_GUEST_CENTS

    // 3. Hold the seats and create the order, all or nothing
    const { reservation, order } = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${date}::text))`)

      const booked = await activeBookings(tx, date)
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
          userId: req.user.id,
          reservationDate: date,
          startMinutes,
          guests,
          totalCents: preorderCents,
          status: 'pending', // only the webhook turns this into 'confirmed'
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

      const [order] = await tx
        .insert(orders)
        .values({
          userId: req.user.id,
          reservationId: reservation.id,
          status: 'pending', // only the webhook turns this into 'paid'
          totalCents: depositCents,
          currency: CURRENCY,
        })
        .returning()

      await tx.insert(orderItems).values({
        orderId: order.id,
        description: 'Booking deposit per guest',
        quantity: guests,
        unitPriceCents: DEPOSIT_PER_GUEST_CENTS,
      })

      return { reservation, order }
    })

    // 4. Start the Stripe Checkout Session
    let session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: CURRENCY,
              product_data: {
                name: `Table deposit, ${date} at ${formatTime(startMinutes)}`,
              },
              unit_amount: DEPOSIT_PER_GUEST_CENTS,
            },
            quantity: guests,
          },
        ],
        client_reference_id: String(order.id),
        metadata: { orderId: String(order.id) },
        customer_email: req.user.email,
        success_url: `${process.env.CLIENT_URL}/?order=${order.id}`,
        cancel_url: `${process.env.CLIENT_URL}/?cancelled=${order.id}`,
        expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60,
      })
    } catch (stripeErr) {
      console.error('Stripe error:', stripeErr.message)
      // The payment could not start, so release the seats
      await db.update(orders).set({ status: 'expired' }).where(eq(orders.id, order.id))
      await db
        .update(reservations)
        .set({ status: 'cancelled' })
        .where(eq(reservations.id, reservation.id))
      throw new HttpError(502, 'We could not start the payment. Please try again.', {
        detail: stripeErr.message, // handy while testing; remove before going live
      })
    }

    // 5. Remember Stripe's session id on the order
    await db
      .update(orders)
      .set({ stripeSessionId: session.id })
      .where(eq(orders.id, order.id))

    res.status(201).json({ orderId: order.id, url: session.url })
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, ...err.extra })
    }
    next(err)
  }
})

export default router