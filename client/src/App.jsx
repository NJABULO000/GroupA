import { useState } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Menu from './components/Menu.jsx'
import Reservation from './components/Reservation.jsx'
import Footer from './components/Footer.jsx'
import AuthModal from './components/AuthModal.jsx'

function App() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <Header onSignIn={() => setAuthOpen(true)} />
      <main>
        <Hero />
        <About />
        <Menu />
        <Reservation />
      </main>
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}

export default App