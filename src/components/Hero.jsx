function Hero() {
  return (
    <section
      id="home"
      className="flex min-h-[70vh] flex-col items-start justify-center bg-ink bg-cover bg-center px-5 py-12 text-paper md:px-10 md:py-16"
      style={{
        backgroundImage:
          "linear-gradient(160deg, rgba(35,27,26,0.85), rgba(58,18,32,0.75)),   url('/images/banner/banner.png')",
      }}
    >
      <h1 className="mb-1 font-heading text-5xl leading-tight sm:text-7xl lg:text-8xl">
        Fire & Vine
      </h1>
      <p className="mb-7 max-w-[42ch] text-lg">
        Flame-grilled food and good wine, made for sharing. Find us at Athlone
        Circle shopping centre in Pietermaritzburg.
      </p>
      <a
        href="#reservation"
        className="inline-block rounded bg-ember px-6 py-3 font-semibold text-ink hover:brightness-110"
      >
        Book a table
      </a>
    </section>
  )
}

export default Hero