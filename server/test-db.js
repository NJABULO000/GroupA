import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const result = await pool.query('select now()')
console.log('Connected! Server time:', result.rows[0].now)
await pool.end()