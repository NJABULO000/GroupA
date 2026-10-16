import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import MenuCard from './components/MenuCard.jsx'
import { menu } from './data/menu.js'

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 px-5 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {menu.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </section>
      </main>
    </>
  )
}

export default App