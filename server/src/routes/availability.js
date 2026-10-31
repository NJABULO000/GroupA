import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { reservations } from '../db/schema.js'
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

// GET /api/availability?date=2026-11-07
router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query
    if (typeof date !== 'string' || !isValidDate(date)) {
      return res.status(400).json({ error: 'Please provide a valid date as YYYY-MM-DD' })
    }

    const today = todayString()
    if (date < today) {
      return res.status(400).json({ error: 'That date has already passed' })
    }

    const booked = await db
      .select({ startMinutes: reservations.startMinutes, guests: reservations.guests })
      .from(reservations)
      .where(eq(reservations.reservationDate, date))

    let starts = slotsForDate(date)
    if (date === today) {
      const now = nowMinutes()
      starts = starts.filter((start) => start > now) // hide times that have passed
    }

    const slots = starts.map((start) => ({
      startMinutes: start,
      time: formatTime(start),
      seatsLeft: seatsLeft(booked, start),
    }))

    res.json({ date, capacity: CAPACITY, slots })
  } catch (err) {
    next(err)
  }
})

export default router