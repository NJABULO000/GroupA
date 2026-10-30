import { sql } from 'drizzle-orm'
import { db } from './index.js'
import { menuItems } from './schema.js'
import { menuData } from './menu.data.js'

async function seed() {
  // Empty the table and restart ids at 1, so running the script twice never makes duplicates
  await db.execute(sql`truncate table menu_items restart identity`)
  await db.insert(menuItems).values(menuData)
  console.log(`Seeded ${menuData.length} menu items`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })