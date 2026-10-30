function Header() {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-wine px-5 py-3 text-paper md:px-10 md:py-4">
      <a href="#home" className="font-heading text-2xl">
        Fire & <span className="font-bold text-ember">Vine</span>
      </a>
      <nav aria-label="Main navigation">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li><a href="#about" className="hover:underline">About</a></li>
          <li><a href="#menu" className="hover:underline">Menu</a></li>
          <li><a href="#reservation" className="hover:underline">Reserve</a></li>
          <li><a href="#visit" className="hover:underline">Visit</a></li>
        </ul>
      </nav>
    </header>
  )
}

export default Header