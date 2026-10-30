function Footer() {
  return (
    <footer id="visit" className="scroll-mt-16 bg-ink px-5 pb-6 pt-12 text-paper md:px-10">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 md:grid-cols-3">
        <div>
          <h2 className="mb-2 font-heading text-xl text-ember">Opening hours</h2>
          <ul>
            <li>Mon to Thu: 11:00 to 21:30</li>
            <li>Fri and Sat: 11:00 to 22:30</li>
            <li>Sun: 10:00 to 16:00</li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 font-heading text-xl text-ember">Find us</h2>
          <address className="not-italic">
            Athlone Circle Shopping Centre<br />
            Pietermaritzburg<br />
            KwaZulu-Natal
          </address>
        </div>
        <div>
          <h2 className="mb-2 font-heading text-xl text-ember">Contact</h2>
          <p>
            hello@fireandvine.example<br />
            033 000 0000
          </p>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-[1100px] border-t border-muted pt-4 text-sm">
        &copy; 2026 Fire & Vine. Student project.
      </p>
    </footer>
  )
}

export default Footer