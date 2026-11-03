import { useEffect, useState } from 'react'
import { formatPrice } from '../lib/format.js'

const MAX_TRIES = 10 // about 20 seconds in total
const DELAY_MS = 2000

// Shows an amount in the order's own currency
function money(cents, currency) {
  return currency === 'zar'
    ? formatPrice(cents)
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(cents / 100)
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 p-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}

function OrderPage({ orderId, onSignIn }) {
  const [order, setOrder] = useState(null)
  // 'checking' | 'paid' | 'pending' | 'failed' | 'signin' | 'missing' | 'error'
  const [state, setState] = useState('checking')
  const [round, setRound] = useState(0) // changing this starts a new round of checks

  useEffect(() => {
    let ignore = false
    let timer

    async function check(attempt) {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (ignore) return
        if (res.status === 401) return setState('signin')
        if (res.status === 404 || res.status === 400) return setState('missing')
        if (!res.ok) throw new Error('Request failed')

        const data = await res.json()
        if (ignore) return
        setOrder(data)

        if (data.status === 'paid') return setState('paid')
        if (data.status === 'expired') return setState('failed')

        // Still pending: the webhook can arrive a moment after the redirect, so ask again
        if (attempt < MAX_TRIES) {
          timer = setTimeout(() => check(attempt + 1), DELAY_MS)
        } else {
          setState('pending')
        }
      } catch {
        if (!ignore) setState('error')
      }
    }

    check(1)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [orderId, round])

  function checkAgain() {
    setState('checking')
    setRound((r) => r + 1)
  }

  const buttonStyle =
    'inline-block rounded bg-wine px-6 py-3 font-semibold text-paper hover:brightness-125'
  const titleStyle = 'mb-2 font-heading text-3xl text-wine md:text-4xl'

  return (
    <section className="mx-auto max-w-[640px] px-5 py-16">
      {state === 'checking' && (
        <div role="status">
          <h1 className={titleStyle}>Checking your payment...</h1>
          <p className="text-muted">This only takes a moment. Please do not close this page.</p>
        </div>
      )}

      {state === 'paid' && order && (
        <div>
          <h1 className={titleStyle}>Payment received</h1>
          <p className="mb-6">Thank you! Your table is confirmed.</p>

          <dl className="mb-6 divide-y divide-line rounded border border-line bg-white">
            <Row label="Order number" value={`#${order.id}`} />
            <Row label="Status" value="Paid" />
            {order.booking && <Row label="Date" value={order.booking.date} />}
            {order.booking && <Row label="Time" value={order.booking.time} />}
            {order.booking && <Row label="Guests" value={order.booking.guests} />}
            <Row label="Deposit paid" value={money(order.totalCents, order.currency)} />
            {order.paidAt && (
              <Row label="Paid on" value={new Date(order.paidAt).toLocaleString()} />
            )}
          </dl>

          <ul className="mb-6 rounded border border-line bg-white p-3">
            {order.items.map((item) => (
              <li key={item.description} className="flex justify-between gap-4">
                <span>
                  {item.description} x {item.quantity}
                </span>
                <span>{money(item.unitPriceCents * item.quantity, order.currency)}</span>
              </li>
            ))}
          </ul>

          {order.booking?.preorderCents > 0 && (
            <p className="mb-6 text-muted">
              Your pre-order of {formatPrice(order.booking.preorderCents)} will be ready when you
              arrive, and you pay for it at the table.
            </p>
          )}

          <a href="/" className={buttonStyle}>Back to the site</a>
        </div>
      )}

      {state === 'pending' && (
        <div role="status">
          <h1 className={titleStyle}>Still waiting for confirmation</h1>
          <p className="mb-2">
            We have not received confirmation of your payment yet. This can take a little longer
            than usual.
          </p>
          <p className="mb-6 text-muted">
            Please do not pay again. Check again in a moment, and your booking will be confirmed
            once the payment is verified.
          </p>
          <button type="button" onClick={checkAgain} className={buttonStyle}>
            Check again
          </button>
        </div>
      )}

      {state === 'failed' && (
        <div>
          <h1 className={titleStyle}>Payment not completed</h1>
          <p className="mb-6">The payment did not go through, so no booking was made.</p>
          <a href="/" className={buttonStyle}>Back to the site</a>
        </div>
      )}

      {state === 'signin' && (
        <div>
          <h1 className={titleStyle}>Please sign in</h1>
          <p className="mb-6">Sign in to see the details of this order.</p>
          <button type="button" onClick={onSignIn} className={buttonStyle}>
            Sign in
          </button>
        </div>
      )}

      {state === 'missing' && (
        <div>
          <h1 className={titleStyle}>Order not found</h1>
          <p className="mb-6">We could not find that order on your account.</p>
          <a href="/" className={buttonStyle}>Back to the site</a>
        </div>
      )}

      {state === 'error' && (
        <div role="alert">
          <h1 className={titleStyle}>Something went wrong</h1>
          <p className="mb-6">We could not load your order. Please try again.</p>
          <button type="button" onClick={checkAgain} className={buttonStyle}>
            Try again
          </button>
        </div>
      )}
    </section>
  )
}

export default OrderPage