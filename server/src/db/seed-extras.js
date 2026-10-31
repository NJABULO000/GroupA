import { sql } from 'drizzle-orm'
import { db } from './index.js'
import { extras } from './schema.js'
import { extrasData } from './extras.data.js'

async function seed() {
  await db.execute(sql`truncate table extras restart identity cascade`)
  await db.insert(extras).values(extrasData)
  console.log(`Seeded ${extrasData.length} extras`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })