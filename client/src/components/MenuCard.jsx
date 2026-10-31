import { useState } from 'react'
import QuantityStepper from './QuantityStepper.jsx'
import { formatPrice } from '../lib/format.js'

function MenuCard({ item, extras = [] }) {
  const [qty, setQty] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])

  function toggleExtra(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )
  }

  // Calculated on every render, so it is never stored in state
  const extrasTotal = extras
    .filter((e) => selectedIds.includes(e.id))
    .reduce((sum, e) => sum + e.priceCents, 0)
  const lineTotal = (item.priceCents + extrasTotal) * qty

  return (
    <article className="flex flex-col overflow-hidden rounded border border-line bg-white">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          width="600"
          height="400"
          loading="lazy"
          className="aspect-[3/2] w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex justify-between gap-4 font-semibold">
          <h3 className="font-heading text-lg">{item.name}</h3>
          <span>{formatPrice(item.priceCents)}</span>
        </div>
        <p className="text-muted">{item.description}</p>

        {extras.length > 0 && (
          <fieldset className="mt-3 flex flex-col gap-1">
            <legend className="mb-1 font-semibold">Extras</legend>
            {extras.map((e) => (
              <label key={e.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(e.id)}
                    onChange={() => toggleExtra(e.id)}
                    className="accent-wine"
                  />
                  {e.name}
                </span>
                <span className="text-muted">+{formatPrice(e.priceCents)}</span>
              </label>
            ))}
          </fieldset>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <QuantityStepper value={qty} onChange={setQty} />
          <span className="font-semibold text-wine">{formatPrice(lineTotal)}</span>
        </div>
      </div>
    </article>
  )
}

export default MenuCard