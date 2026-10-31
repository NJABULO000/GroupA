import QuantityStepper from './QuantityStepper.jsx'
import { formatPrice } from '../lib/format.js'

function OrderSummary({ lines, totalCents, onQuantityChange, onRemove, onClear }) {
  if (lines.length === 0) {
    return (
      <p className="text-muted">
        Your pre-order is empty. Add dishes from the menu if you would like your food
        ready when you arrive.
      </p>
    )
  }

  return (
    <div>
      <ul className="divide-y divide-line rounded border border-line bg-white">
        {lines.map((line) => (
          <li key={line.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{line.name}</p>
              {line.extras.length > 0 && (
                <p className="text-sm text-muted">+ {line.extras.map((e) => e.name).join(', ')}</p>
              )}
              <p className="text-sm text-muted">{formatPrice(line.unitCents)} each</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <QuantityStepper
                value={line.quantity}
                max={20}
                onChange={(q) => onQuantityChange(line.key, q)}
              />
              <span className="min-w-20 text-right font-semibold text-wine">
                {formatPrice(line.unitCents * line.quantity)}
              </span>
              <button type="button" onClick={() => onRemove(line.key)} className="text-wine underline">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onClear} className="text-wine underline">
          Clear order
        </button>
        <p className="text-lg font-semibold">Total: {formatPrice(totalCents)}</p>
      </div>
    </div>
  )
}

export default OrderSummary