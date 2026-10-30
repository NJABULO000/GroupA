import { useState } from 'react'
import { authClient } from '../lib/auth-client.js'

function AuthModal({ open, onClose }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const isSignUp = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const name = form.get('name')
    const email = form.get('email')
    const password = form.get('password')

    const result = isSignUp
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password })

    setLoading(false)
    if (result.error) {
      setError(result.error.message || 'Something went wrong. Please try again.')
      return
    }
    onClose()
  }

  function switchMode() {
    setMode(isSignUp ? 'signin' : 'signup')
    setError('')
  }

  const inputStyle = 'w-full rounded border border-muted bg-white p-3'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/80 p-5"
    >
      <div className="w-full max-w-[420px] rounded-lg bg-paper p-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="auth-title" className="font-heading text-2xl text-wine">
            {isSignUp ? 'Create an account' : 'Sign in'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-name" className="font-semibold">Name</label>
              <input id="auth-name" name="name" type="text" required className={inputStyle} />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="auth-email" className="font-semibold">Email</label>
            <input id="auth-email" name="email" type="email" required className={inputStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="auth-password" className="font-semibold">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              required
              minLength={8}
              className={inputStyle}
            />
          </div>

          {error && (
            <p role="alert" className="text-wine">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-wine px-6 py-3 font-semibold text-paper hover:brightness-125 disabled:opacity-60"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-muted">
          {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
          <button type="button" onClick={switchMode} className="font-semibold text-wine underline">
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthModal