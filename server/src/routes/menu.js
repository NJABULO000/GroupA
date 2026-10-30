import { Router } from 'express'
import { asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { menuItems } from '../db/schema.js'

const router = Router()

// GET /api/menu: returns every dish, ordered by id
router.get('/', async (req, res, next) => {
  try {
    const items = await db.select().from(menuItems).orderBy(asc(menuItems.id))
    res.json(items)
  } catch (err) {
    next(err)
  }
})

export default router