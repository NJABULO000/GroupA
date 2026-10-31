import { useState } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Menu from './components/Menu.jsx'
import OrderSummary from './components/OrderSummary.jsx'
import Reservation from './components/Reservation.jsx'
import Footer from './components/Footer.jsx'
import AuthModal from './components/AuthModal.jsx'
import CartBar from './components/CartBar.jsx'
import { useCart } from './lib/useCart.js'

function App() {
  const [authOpen, setAuthOpen] = useState(false)
  const cart = useCart()

  return (
    <div className={cart.count > 0 ? 'pb-16' : ''}>
      <Header onSignIn={() => setAuthOpen(true)} />
      <main>
        <Hero />
        <About />
        <Menu onAdd={cart.addLine} />
        <section id="order" className="mx-auto max-w-[1100px] scroll-mt-16 px-5 py-16">
          <h2 className="mb-4 font-heading text-3xl text-wine md:text-4xl">Your pre-order</h2>
          <OrderSummary
            lines={cart.lines}
            totalCents={cart.totalCents}
            onQuantityChange={cart.setQuantity}
            onRemove={cart.removeLine}
            onClear={cart.clearCart}
          />
        </section>
        <Reservation />
      </main>
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <CartBar count={cart.count} totalCents={cart.totalCents} />
    </div>
  )
}

export default App