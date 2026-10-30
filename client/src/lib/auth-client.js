import { createAuthClient } from 'better-auth/react'

// No baseURL needed: requests go to the same address as the site,
// and the Vite proxy (later, the Vercel rewrite) sends /api to the server.
export const authClient = createAuthClient()