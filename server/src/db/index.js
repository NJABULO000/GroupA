import 'dotenv/config'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.js'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // a small pool is plenty for this project
  idleTimeoutMillis: 10_000, // close idle connections after 10 seconds, before Neon closes them
  connectionTimeoutMillis: 15_000, // allow time for a sleeping database to wake up
  keepAlive: true, // keep the connection from being dropped silently
})

// Neon closes idle connections. Without this listener, that error can crash the whole server.
pool.on('error', (err) => {
  console.error('Idle database connection error:', err.message)
})

export const db = drizzle({ client: pool, schema })