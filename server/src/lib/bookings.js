import { and, eq, gt, or } from 'drizzle-orm'
import { reservations } from '../db/schema.js'

const HOLD_MS = 40 * 60 * 1000 // a pending booking holds its seats for 40 minutes at most

// Bookings that currently use up seats on a date:
// confirmed ones, plus pending ones created recently. Cancelled ones never count.
export function activeBookings(dbOrTx, date) {
  const cutoff = new Date(Date.now() - HOLD_MS)
  return dbOrTx
    .select({ startMinutes: reservations.startMinutes, guests: reservations.guests })
    .from(reservations)
    .where(
      and(
        eq(reservations.reservationDate, date),
        or(
          eq(reservations.status, 'confirmed'),
          and(eq(reservations.status, 'pending'), gt(reservations.createdAt, cutoff)),
        ),
      ),
    )
}