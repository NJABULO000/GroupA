import { Router } from 'express'
import { db } from '../db/index.js'
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

    const booked = await activeBookings(db, date)

    let starts = slotsForDate(date)
    if (date === today) {
      const now = nowMinutes()
      starts = starts.filter((start) => start > now)
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