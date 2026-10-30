import { useState } from 'react'
import QuantityStepper from './QuantityStepper.jsx'
import { formatPrice } from '../lib/format.js'

function MenuCard({ item }) {
  const [qty, setQty] = useState(1)

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
        <div className="mt-auto flex items-center justify-between pt-4">
          <QuantityStepper value={qty} onChange={setQty} />
          <span className="font-semibold text-wine">
            {formatPrice(item.priceCents * qty)}
          </span>
        </div>
      </div>
    </article>
  )
}

export default MenuCard