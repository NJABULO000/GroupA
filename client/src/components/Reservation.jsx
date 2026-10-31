import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client.js'
import { formatPrice } from '../lib/format.js'

// Today's date as YYYY-MM-DD in the visitor's own time zone
function todayString() {
  return new Date().toLocaleDateString('en-CA')
}

function Reservation({ cart, onSignIn }) {
  const { data: session, isPending } = authClient.useSession()

  const [date, setDate] = useState('')
  const [guestsText, setGuestsText] = useState('2')
  const [startMinutes, setStartMinutes] = useState(null)
  const [availability, setAvailability] = useState(null) // { date, slots } or { date, error }
  const [refreshKey, setRefreshKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(null)

  const guests = Number(guestsText)
  const guestsValid = Number.isInteger(guests) && guests >= 1 && guests <= 25

  // Ask the server which times are free whenever the date changes
  useEffect(() => {
    if (!date) return
    let ignore = false

    async function load() {
      try {
        const res = await fetch(`/api/availability?date=${date}`)
        const data = await res.json()
        if (ignore) return
        setAvailability(
          res.ok
            ? { date, slots: data.slots }
            : { date, error: data.error || 'Could not load the times.' },
        )
      } catch {
        if (!ignore) setAvailability({ date, error: 'Could not load the times. Please try again.' })
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [date, refreshKey])

  // Values worked out from state during rendering
  const current = availability && availability.date === date ? availability : null
  const loadingSlots = Boolean(date) && !current
  const selectedSlot = current?.slots?.find((s) => s.startMinutes === startMinutes)
  const canBook = Boolean(guestsValid && selectedSlot && selectedSlot.seatsLeft >= guests)

  function handleDateChange(event) {
    setDate(event.target.value)
    setStartMinutes(null)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canBook) return
    setError('')
    setSubmitting(true)

    // Only ids and quantities are sent. The server works out the prices.
    const items = cart.lines.map((line) => ({
      menuItemId: line.menuItemId,
      quantity: line.quantity,
      extraIds: line.extras.map((e) => e.id),
    }))

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startMinutes, guests, items }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 201) {
        setConfirmation({ ...data, hadOrder: items.length > 0 })
        cart.clearCart()
        setStartMinutes(null)
        setRefreshKey((k) => k + 1)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        if (res.status === 409) {
          // Someone else took the seats first: reload the times
          setStartMinutes(null)
          setRefreshKey((k) => k + 1)
        }
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = 'w-full rounded border border-muted bg-white p-3'

  return (
    <section
      id="reservation"
      className="mx-auto max-w-[1100px] scroll-mt-16 border-t border-line px-5 py-16"
    >
      <h2 className="mb-2 font-heading text-3xl text-wine md:text-4xl">Reserve a table</h2>
      <p className="mb-6 text-muted">
        Tables are held for one hour. Add dishes to your pre-order and your food will be
        ready when you arrive.
      </p>

      {isPending && <p>Loading...</p>}

      {!isPending && !session && (
        <div className="max-w-[640px] rounded border border-line bg-white p-5">
          <p className="mb-3">Please sign in to book a table.</p>
          <button
            type="button"
            onClick={onSignIn}
            className="rounded bg-wine px-6 py-3 font-semibold text-paper hover:brightness-125"
          >
            Sign in to book
          </button>
        </div>
      )}

      {!isPending && session && (
        <form onSubmit={handleSubmit} className="flex max-w-[640px] flex-col gap-6">
          <p className="text-muted">Booking as {session.user.name}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="res-date" className="font-semibold">Date</label>
              <input
                id="res-date"
                type="date"
                min={todayString()}
                value={date}
                onChange={handleDateChange}
                required
                className={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="res-guests" className="font-semibold">Number of guests</label>
              <input
                id="res-guests"
                type="number"
                min="1"
                max="25"
                value={guestsText}
                onChange={(e) => setGuestsText(e.target.value)}
                required
                className={inputStyle}
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 font-semibold">Time</legend>
            {!date && <p className="text-muted">Choose a date to see the available times.</p>}
            {loadingSlots && <p className="text-muted">Checking available times...</p>}
            {current?.error && (
              <p role="alert" className="text-wine">{current.error}</p>
            )}
            {current?.slots && current.slots.length === 0 && (
              <p className="text-muted">There are no tables left on this date.</p>
            )}
            {current?.slots && current.slots.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {current.slots.map((slot) => {
                    const ok = guestsValid && slot.seatsLeft >= guests
                    const selected = slot.startMinutes === startMinutes
                    return (
                      <button
                        key={slot.startMinutes}
                        type="button"
                        disabled={!ok}
                        aria-pressed={selected}
                        onClick={() => setStartMinutes(slot.startMinutes)}
                        className={`rounded border border-wine px-2 py-2 text-center disabled:cursor-not-allowed disabled:opacity-40 ${
                          selected ? 'bg-wine text-paper' : 'text-wine hover:bg-wine/10'
                        }`}
                      >
                        <span className="block font-semibold">{slot.time}</span>
                        <span className="block text-xs">
                          {slot.seatsLeft === 0 ? 'Full' : `${slot.seatsLeft} left`}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {guestsValid && (
                  <p className="mt-2 text-sm text-muted">
                    Greyed-out times do not have room for {guests} {guests === 1 ? 'guest' : 'guests'}.
                  </p>
                )}
              </>
            )}
          </fieldset>

          <div className="rounded border border-line bg-white p-4">
            <h3 className="mb-1 font-heading text-lg">Pre-order</h3>
            {cart.count === 0 ? (
              <p className="text-muted">
                No dishes added yet. Add dishes from the menu if you want your food ready when you arrive.
              </p>
            ) : (
              <p>
                {cart.count} {cart.count === 1 ? 'item' : 'items'}, {formatPrice(cart.totalCents)}.{' '}
                <a href="#order" className="text-wine underline">Edit order</a>
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-wine">{error}</p>
          )}

          <button
            type="submit"
            disabled={!canBook || submitting}
            className="justify-self-start rounded bg-wine px-6 py-3 font-semibold text-paper hover:brightness-125 disabled:opacity-60"
          >
            {submitting ? 'Booking...' : 'Reserve my table'}
          </button>
        </form>
      )}

      {confirmation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
          className="fixed inset-0 z-20 flex items-center justify-center bg-ink/80 p-5"
        >
          <div className="w-full max-w-[420px] rounded-lg bg-paper p-8 text-center">
            <h2 id="confirmation-title" className="mb-2 font-heading text-2xl text-wine">
              Booking confirmed
            </h2>
            <p className="mb-1 font-semibold">Reference #{confirmation.id}</p>
            <p className="mb-4">
              {confirmation.date} at {confirmation.time} for {confirmation.guests}{' '}
              {confirmation.guests === 1 ? 'guest' : 'guests'}.
            </p>
            {confirmation.hadOrder && (
              <p className="mb-4">
                Your pre-order total is {formatPrice(confirmation.totalCents)}. Your food will
                be ready when you arrive, and you pay at the table.
              </p>
            )}
            <button
              type="button"
              onClick={() => setConfirmation(null)}
              className="rounded bg-wine px-6 py-3 font-semibold text-paper hover:brightness-125"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Reservation