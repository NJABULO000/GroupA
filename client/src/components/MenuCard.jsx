import { useState } from 'react'
import QuantityStepper from './QuantityStepper.jsx'
import { formatPrice } from '../lib/format.js'

function MenuCard({ item, extras = [], onAdd = () => {} }) {
  const [qty, setQty] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])

  function toggleExtra(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )
  }

  const chosen = extras.filter((e) => selectedIds.includes(e.id))
  const unitCents = item.priceCents + chosen.reduce((sum, e) => sum + e.priceCents, 0)

  function handleAdd() {
    const extraIds = chosen.map((e) => e.id).sort((a, b) => a - b)
    onAdd({
      key: `${item.id}:${extraIds.join(',')}`,
      menuItemId: item.id,
      name: item.name,
      quantity: qty,
      unitCents,
      extras: chosen.map((e) => ({ id: e.id, name: e.name })),
    })
    setQty(1)
    setSelectedIds([])
  }

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
          <span className="font-semibold text-wine">{formatPrice(unitCents * qty)}</span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="mt-3 rounded bg-wine px-4 py-2 font-semibold text-paper hover:brightness-125"
        >
          Add to my order
        </button>
      </div>
    </article>
  )
}

export default MenuCard