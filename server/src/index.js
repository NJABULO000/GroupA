import 'dotenv/config'
import express from 'express'
import cors from 'cors'
  import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.js'
import menuRouter from './routes/menu.js'
import extrasRouter from './routes/extras.js'
 import availabilityRouter from './routes/availability.js'
 import checkoutRouter from './routes/checkout.js'
   import { requireAuth } from './middleware/requireAuth.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))

// Better Auth must be mounted BEFORE express.json()
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

  // Returns the signed-in user, or 401 if there is no valid session
  app.get('/api/me', requireAuth, (req, res) => {
    res.json(req.user)
  })

app.use('/api/menu', menuRouter)
app.use('/api/extras', extrasRouter)
app.use('/api/availability', availabilityRouter)
  app.use('/api/checkout', checkoutRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
})

app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
  console.log(`Server running on http://localhost:${PORT}`)
})