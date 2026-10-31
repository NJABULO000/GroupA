export const CAPACITY = 25
export const STAY_MINUTES = 60
export const SLOT_STEP = 30
const TIME_ZONE = 'Africa/Johannesburg'

// Opening hours as minutes after midnight (sample content, matches your footer).
// "last" is the last seating: closing time minus the one-hour stay.
const HOURS = {
  weekday: { first: 11 * 60, last: 20 * 60 + 30 }, // Mon to Thu
  weekend: { first: 11 * 60, last: 21 * 60 + 30 }, // Fri and Sat
  sunday: { first: 10 * 60, last: 15 * 60 }, // Sun
}

export function isValidDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(`${dateStr}T12:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr
}

// Today's date in South Africa as YYYY-MM-DD (the server itself runs in UTC)
export function todayString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIME_ZONE })
}

// Current time in South Africa, as minutes after midnight
export function nowMinutes() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const hour = Number(parts.find((p) => p.type === 'hour').value)
  const minute = Number(parts.find((p) => p.type === 'minute').value)
  return hour * 60 + minute
}

// Every bookable start time for a date, in minutes after midnight
export function slotsForDate(dateStr) {
  const day = new Date(`${dateStr}T12:00:00Z`).getUTCDay() // 0 = Sunday
  const hours = day === 0 ? HOURS.sunday : day === 5 || day === 6 ? HOURS.weekend : HOURS.weekday
  const slots = []
  for (let t = hours.first; t <= hours.last; t += SLOT_STEP) slots.push(t)
  return slots
}

export function formatTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

// How many guests are seated at minute t
export function occupancyAt(bookings, t) {
  return bookings
    .filter((b) => b.startMinutes <= t && t < b.startMinutes + STAY_MINUTES)
    .reduce((sum, b) => sum + b.guests, 0)
}

// Seats still free for a new booking that starts at `start`.
// It occupies [start, start + 60), so check each 30-minute step inside it
// and take the busiest one.
export function seatsLeft(bookings, start) {
  let busiest = 0
  for (let t = start; t < start + STAY_MINUTES; t += SLOT_STEP) {
    busiest = Math.max(busiest, occupancyAt(bookings, t))
  }
  return CAPACITY - busiest
}