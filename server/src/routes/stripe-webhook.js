import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { orders, reservations } from '../db/schema.js'
import { stripe } from '../lib/stripe.js'

export async function stripeWebhook(req, res) {
  // 1. Prove the message really came from Stripe, using the raw body and the signing secret
  const signature = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.error('Webhook signature check failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`Webhook received: ${event.type}`)

  // 2. Act on the event
  try {
    if (event.type === 'checkout.session.completed') {
      await markPaid(event.data.object)
    } else if (event.type === 'checkout.session.expired') {
      await markExpired(event.data.object)
    }
    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler failed:', err)
    res.status(500).send('Webhook handler failed') // Stripe will try again later
  }
}

// The ONLY place an order becomes 'paid' and a booking becomes 'confirmed'
async function markPaid(session) {
  const orderId = Number(session.metadata?.orderId)
  console.log(
    `markPaid: orderId=${session.metadata?.orderId}, payment_status=${session.payment_status}, ` +
      `amount=${session.amount_total} ${session.currency}`,
  )
  if (session.payment_status !== 'paid') {
    console.log('Skipped: the session is not paid')
    return
  }
  if (!Number.isInteger(orderId)) {
    console.log('Skipped: no orderId in the session metadata (is this a Stripe test event?)')
    return
  }

  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId))
    if (!order) {
      console.log(`Skipped: order ${orderId} not found in this database`)
      return
    }
    if (order.status !== 'pending') {
      console.log(`Skipped: order ${orderId} is already ${order.status}`)
      return
    }

    // Defence: what Stripe charged must match what our database expects
    if (session.amount_total !== order.totalCents || session.currency !== order.currency) {
      console.error(
        `Amount mismatch for order ${orderId}: Stripe ${session.amount_total} ${session.currency}, ` +
          `database ${order.totalCents} ${order.currency}. Not marked as paid.`,
      )
      return
    }

    await tx
      .update(orders)
      .set({ status: 'paid', paidAt: new Date(), stripeSessionId: session.id })
      .where(eq(orders.id, orderId))

    if (order.reservationId) {
      await tx
        .update(reservations)
        .set({ status: 'confirmed' })
        .where(eq(reservations.id, order.reservationId))
    }
    console.log(`Order ${orderId} marked as PAID`)
  })
}

// An unpaid session ran out of time: free the seats
async function markExpired(session) {
  const orderId = Number(session.metadata?.orderId)
  if (!Number.isInteger(orderId)) return

  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId))
    if (!order || order.status !== 'pending') return

    await tx.update(orders).set({ status: 'expired' }).where(eq(orders.id, orderId))

    if (order.reservationId) {
      await tx
        .update(reservations)
        .set({ status: 'cancelled' })
        .where(and(eq(reservations.id, order.reservationId), eq(reservations.status, 'pending')))
    }
    console.log(`Order ${orderId} expired and its seats were released`)
  })
}