import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth.js'

// Blocks the request unless the browser's session cookie belongs to a real user
export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      return res.status(401).json({ error: 'Please sign in first' })
    }
    req.user = session.user // the next function can now read req.user
    next()
  } catch (err) {
    next(err)
  }
}