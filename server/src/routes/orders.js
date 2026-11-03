import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { orders, orderItems, reservations } from '../db/schema.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { formatTime } from '../lib/capacity.js'

const router = Router()

// GET /api/orders/:id
// A signed-in user can only look up THEIR OWN orders
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, req.user.id)))

    // Someone else's order looks exactly like an order that does not exist
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const items = await db
      .select({
        description: orderItems.description,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))

    let booking = null
    if (order.reservationId) {
      const [r] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, order.reservationId))
      if (r) {
        booking = {
          id: r.id,
          date: r.reservationDate,
          time: formatTime(r.startMinutes),
          guests: r.guests,
          status: r.status,
          preorderCents: r.totalCents,
        }
      }
    }

    res.json({
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      paidAt: order.paidAt,
      items,
      booking,
    })
  } catch (err) {
    next(err)
  }
})

export default router
