import { pgTable, text, timestamp, boolean, integer, serial } from 'drizzle-orm/pg-core'
import { pgTable, text, timestamp, boolean, integer, serial, date, primaryKey } from 'drizzle-orm/pg-core'
// ---- Auth tables (used by Better Auth) ----
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
})

// ---- Your app's table ----
export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  priceCents: integer('price_cents').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
})

// ---- Bookings and extras ----
export const extras = pgTable('extras', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // which menu category this extra applies to
  priceCents: integer('price_cents').notNull(),
})

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  reservationDate: date('reservation_date', { mode: 'string' }).notNull(),
  startMinutes: integer('start_minutes').notNull(), // minutes after midnight: 12:00 = 720
  guests: integer('guests').notNull(),
  totalCents: integer('total_cents').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const reservationItems = pgTable('reservation_items', {
  id: serial('id').primaryKey(),
  reservationId: integer('reservation_id').notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(), // the price when the order was placed
})

export const reservationItemExtras = pgTable(
  'reservation_item_extras',
  {
    reservationItemId: integer('reservation_item_id').notNull().references(() => reservationItems.id, { onDelete: 'cascade' }),
    extraId: integer('extra_id').notNull().references(() => extras.id),
    priceCents: integer('price_cents').notNull(),
  },
  (t) => [primaryKey({ columns: [t.reservationItemId, t.extraId] })],
)