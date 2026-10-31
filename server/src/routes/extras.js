import { Router } from 'express'
import { asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { extras } from '../db/schema.js'

const router = Router()

// GET /api/extras: returns every extra, ordered by id
router.get('/', async (req, res, next) => {
  try {
    const rows = await db.select().from(extras).orderBy(asc(extras.id))
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

export default router