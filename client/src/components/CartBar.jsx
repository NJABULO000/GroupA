import { formatPrice } from '../lib/format.js'

function CartBar({ count, totalCents }) {
  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-ink px-5 py-3 text-paper">
      <p>
        <span className="font-semibold">
          {count} {count === 1 ? 'item' : 'items'}
        </span>{' '}
        in your order, {formatPrice(totalCents)}
      </p>
      <a href="#order" className="rounded bg-ember px-4 py-2 font-semibold text-ink">
        Review and book
      </a>
    </div>
  )
}

export default CartBar