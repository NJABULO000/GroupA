import { useEffect, useState } from 'react'
import MenuCard from './MenuCard.jsx'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'starters', label: 'Starters' },
  { value: 'mains', label: 'Mains' },
  { value: 'desserts', label: 'Desserts' },
]

function Menu({ onAdd }) {
  const [items, setItems] = useState([])
  const [extras, setExtras] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const [menuRes, extrasRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/extras'),
        ])
        if (!menuRes.ok || !extrasRes.ok) throw new Error('Request failed')
        const [menuData, extrasData] = await Promise.all([
          menuRes.json(),
          extrasRes.json(),
        ])
        if (!ignore) {
          setItems(menuData)
          setExtras(extrasData)
          setStatus('ready')
        }
      } catch {
        if (!ignore) setStatus('error')
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [])

  const visibleItems =
    filter === 'all' ? items : items.filter((item) => item.category === filter)

  return (
    <section id="menu" className="mx-auto max-w-[1100px] scroll-mt-16 px-5 py-16">
      <h2 className="font-heading text-3xl text-wine md:text-4xl">Menu</h2>
      <p className="mb-6 text-muted">
        Ask your server which wine pairs best with your meal.
      </p>

      {status === 'loading' && <p>Loading the menu...</p>}
      {status === 'error' && (
        <p role="alert" className="text-wine">
          Sorry, we could not load the menu. Please try again later.
        </p>
      )}

      {status === 'ready' && (
        <>
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
              <MenuCard
                key={item.id}
                item={item}
                extras={extras.filter((e) => e.category === item.category)}
                onAdd={onAdd}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Menu