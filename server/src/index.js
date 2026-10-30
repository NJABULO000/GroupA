import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import menuRouter from './routes/menu.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))

// The Better Auth handler goes here in step 7, before express.json()
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/menu', menuRouter)

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Errors from any route end up here
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})