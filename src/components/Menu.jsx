import { useState } from 'react'
import MenuCard from './MenuCard.jsx'
import { menu } from '../data/menu.js'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'starters', label: 'Starters' },
  { value: 'mains', label: 'Mains' },
  { value: 'desserts', label: 'Desserts' },
]

function Menu() {
  const [filter, setFilter] = useState('all')

  const visibleItems =
    filter === 'all' ? menu : menu.filter((item) => item.category === filter)

  return (
    <section id="menu" className="mx-auto max-w-[1100px] scroll-mt-16 px-5 py-16">
      <h2 className="font-heading text-3xl text-wine md:text-4xl">Menu</h2>
      <p className="mb-6 text-muted">
        Ask your server which wine pairs best with your meal.
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded border border-wine px-4 py-2 font-semibold ${
              filter === f.value ? 'bg-wine text-paper' : 'text-wine hover:bg-wine/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

export default Menu