import { authClient } from '../lib/auth-client.js'

function Header({ onSignIn }) {
  const { data: session, isPending } = authClient.useSession()

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-wine px-5 py-3 text-paper md:px-10 md:py-4">
      <a href="#home" className="font-heading text-2xl">
        Fire & <span className="font-bold text-ember">Vine</span>
      </a>
      <nav aria-label="Main navigation">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <li><a href="#about" className="hover:underline">About</a></li>
          <li><a href="#menu" className="hover:underline">Menu</a></li>
          <li><a href="#reservation" className="hover:underline">Reserve</a></li>
          <li><a href="#visit" className="hover:underline">Visit</a></li>
          {!isPending && session && (
            <>
              <li className="text-ember">Hi, {session.user.name}</li>
              <li>
                <button type="button" onClick={() => authClient.signOut()} className="rounded border border-paper px-3 py-1 hover:bg-paper hover:text-wine">
                  Sign out
                </button>
              </li>
            </>
          )}
          {!isPending && !session && (
            <li>
              <button type="button" onClick={onSignIn} className="rounded border border-paper px-3 py-1 hover:bg-paper hover:text-wine">
                Sign in
              </button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}

export default Header