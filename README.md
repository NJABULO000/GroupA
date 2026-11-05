# Fire & Vine

A full-stack restaurant website for **Fire & Vine**, a grill and wine restaurant at Athlone Circle shopping centre in Pietermaritzburg. Guests can browse the menu, customise dishes with extras, build a pre-order, and book a table by paying a small deposit through Stripe Checkout (test mode).

**Live site:** https://fire-and-vine.vercel.app

> Payments run in Stripe **test mode**, so no real money moves. To try a payment, use the test card `4242 4242 4242 4242` with any future expiry date and any CVC.

> The backend runs on a free plan that sleeps when idle. The first request after a quiet period can take up to a minute while the server and database wake up.

This is a student project. The menu, prices, opening hours and contact details are sample content.

## Features

- Menu loaded from a Postgres database, with category filters
- Extras and toppings on each dish, with live price updates
- Pre-order cart: add dishes with extras, change quantities, review the total
- Table booking with a date picker and time slots that show the seats left
- Capacity rule: each booking holds its table for one hour, and no more than 25 guests can be seated at the same time
- Booking deposit per guest, paid online with Stripe Checkout
- Webhook that verifies the payment and is the only thing that marks an order as paid
- Success page that confirms the order status after payment
- Optional pre-order attached to a booking, so food is ready when guests arrive (paid at the table)
- Sign up, sign in and sign out, with sessions that survive a page refresh
- Responsive layout for phone, tablet and desktop, with no horizontal scroll

## Tech stack

| Part | Tool |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL, hosted on Neon |
| ORM | Drizzle |
| Authentication | Better Auth (email and password, database sessions) |
| Payments | Stripe Checkout and webhooks (test mode) |
| Hosting | Vercel (frontend), Render (backend) |

## How it fits together

```
Browser  ->  Vercel (React app)  ->  Render (Express API)  ->  Neon (Postgres)
                                           ^
                                           |  webhook (payment confirmed)
                                        Stripe  <-  browser pays on Stripe's hosted page
```

The browser only talks to the Vercel address. A rewrite in `client/vercel.json` forwards every `/api` request to the Render server, so cookies stay on one site. In development, the Vite proxy does the same job. Stripe calls the Render server directly to confirm payments.

## Project structure

```
.
├── client/                 React + Tailwind app
│   ├── src/
│   │   ├── components/     Header, Hero, About, Menu, MenuCard, QuantityStepper,
│   │   │                   OrderSummary, CartBar, Reservation, OrderPage,
│   │   │                   Footer, AuthModal
│   │   ├── lib/            useCart.js, format.js, auth-client.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css       Tailwind import and theme colours
│   ├── vercel.json         rewrites /api to the Render server
│   └── vite.config.js      Tailwind plugin and dev proxy
├── server/                 Express API
│   ├── src/
│   │   ├── db/             schema.js, index.js, seed scripts and seed data
│   │   ├── middleware/     requireAuth.js (blocks signed-out requests)
│   │   ├── routes/         menu.js, extras.js, availability.js, checkout.js,
│   │   │                   orders.js, stripe-webhook.js
│   │   ├── lib/            capacity.js (booking rule), bookings.js, stripe.js, errors.js
│   │   ├── auth.js         Better Auth setup
│   │   └── index.js        app, middleware and routes
│   ├── drizzle.config.js
│   └── .env.example        names of the required variables
└── README.md
```

## Database

| Table | What it holds |
|---|---|
| `user` | One row per account |
| `account` | How a user signs in, with the password stored as a one-way hash |
| `session` | One row per login: a token and an expiry time |
| `verification` | Short-lived codes (required by Better Auth) |
| `menu_items` | The dishes: name, category, price in cents, description, image |
| `extras` | Add-ons and toppings, each tied to a menu category |
| `reservations` | Who booked, the date, the start time, guests, the pre-order total and a status: `pending`, `confirmed` or `cancelled` |
| `reservation_items` | The dishes in a pre-order, with quantity and the price at the time |
| `reservation_item_extras` | The extras chosen for each ordered dish (many-to-many) |
| `orders` | One row per payment: the user, the booking, a status (`pending`, `paid` or `expired`), the total in cents, the currency, the Stripe session id and when it was paid |
| `order_items` | What was bought and at what price (the deposit, with quantity and unit price) |

Prices are stored in cents (R75 is `7500`) to avoid rounding errors. Each booking starts at a 30-minute time, stored as minutes after midnight.

## API

| Method | Path | Sign-in needed | Description |
|---|---|---|---|
| GET | `/api/health` | No | Server health check |
| GET | `/api/menu` | No | All dishes |
| GET | `/api/extras` | No | All extras |
| GET | `/api/availability?date=YYYY-MM-DD` | No | Time slots, seats left and the deposit per guest for a date |
| POST | `/api/checkout` | Yes | Validates a booking, holds the seats, creates the order and returns the Stripe payment page address |
| GET | `/api/orders/:id` | Yes | The signed-in user's own order, with its status and booking |
| POST | `/api/stripe/webhook` | Stripe signature | Receives Stripe's events and marks orders paid or expired |
| GET | `/api/me` | Yes | The signed-in user |
| ALL | `/api/auth/*` | | Sign up, sign in, sign out and sessions (Better Auth) |

### Booking rules

- Only signed-in users can book. A `requireAuth` middleware answers `401` to anyone else.
- Each booking holds its seats for one hour, so a booking at 12:00 also counts against 11:30 and 12:30.
- The busiest moment inside a booking's hour must stay at 25 guests or fewer, otherwise the server answers `409`.
- Confirmed bookings and recent pending bookings count against the limit. Cancelled and expired ones do not.
- The server checks the seats and saves the booking inside one database transaction with a lock on the date, so two people cannot take the last seats at the same time.
- The browser sends only ids and quantities. The server looks up every price and works out the deposit itself.

## Payments

The booking deposit is a fixed amount per guest, set in one place on the server (`DEPOSIT_PER_GUEST_CENTS` and `CURRENCY` in `server/src/lib/stripe.js`). Any pre-order food is paid at the table.

### The payment flow

1. The guest picks a date, a time and the number of guests, and clicks **Pay deposit and book**.
2. The browser calls `POST /api/checkout` with the date, time, guests and the pre-order's dish and extra ids. It never sends a price.
3. The server checks the user is signed in, validates the input and checks the seats inside a transaction. It saves a `pending` booking and a `pending` order with its items, then creates a Stripe Checkout Session and returns its address.
4. The browser goes to Stripe's hosted payment page. Card details never touch this site.
5. When the payment completes, Stripe calls `POST /api/stripe/webhook`. The server verifies Stripe's signature, then marks the order `paid` and the booking `confirmed`. **This is the only code that does so.**
6. Stripe sends the guest back to `/?order=ID`. The success page reads the order from `GET /api/orders/:id` and checks again a few times if the webhook has not arrived yet.
7. If the guest abandons the payment, the Checkout Session expires. The order becomes `expired`, the booking `cancelled`, and the seats are freed. Pending bookings also stop counting after 40 minutes, even if no webhook arrives.

### Why it is built this way

- **The webhook is the source of truth.** A redirect only proves a browser reached a URL, so the success page never decides anything. It shows the status the database holds.
- **The webhook is safe to repeat.** Stripe can deliver an event more than once, and the handler only changes orders that are still `pending`.
- **The amount is double-checked.** Before marking an order paid, the webhook compares the amount and currency Stripe charged with the order in the database.
- **Orders are private.** The lookup route only returns orders that belong to the signed-in user.
- **The webhook needs the raw request body** to verify the signature, so its route is mounted before `express.json()`.

### Testing payments

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card is declined, and the order stays `pending` |

Use any future expiry date, any three-digit CVC, and any name and details.

## Run it locally

You need Node.js 20 or newer, a free Neon Postgres database, a free Stripe account in test mode, and the Stripe CLI.

1. Clone the repo and open it in your editor.
2. Set up the server:
   ```
   cd server
   npm install
   ```
   Copy `.env.example` to a new file called `.env` and fill in the values (see below).
3. Create the tables and add the data:
   ```
   npm run db:push
   npm run db:seed
   npm run db:seed-extras
   ```
4. Start the server (port 3000):
   ```
   npm run dev
   ```
5. In a second terminal, start the client (port 5173):
   ```
   cd client
   npm install
   npm run dev
   ```
6. In a third terminal, forward Stripe's webhook events to your server. Log in once with `stripe login`, then run:
   ```
   stripe listen --events "checkout.session.completed,checkout.session.expired" --forward-to localhost:3000/api/stripe/webhook
   ```
   It prints a signing secret that starts with `whsec_`. Put it in `server/.env` as `STRIPE_WEBHOOK_SECRET`, then restart the server.
7. Open http://localhost:5173.

### Environment variables (`server/.env`)

| Name | Description |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `BETTER_AUTH_SECRET` | A long random secret that signs sessions |
| `BETTER_AUTH_URL` | The address the browser uses: `http://localhost:5173` locally, the Vercel address when deployed |
| `CLIENT_URL` | The address of the frontend, set the same way. Stripe sends guests back here after paying |
| `STRIPE_SECRET_KEY` | Your Stripe secret key (starts with `sk_test_`) |
| `STRIPE_WEBHOOK_SECRET` | The signing secret of the webhook (starts with `whsec_`). It is different for the Stripe CLI and for the live webhook endpoint |
| `PORT` | Optional. Defaults to 3000, and the host sets it when deployed |

Another useful script in `server`: `npm run db:studio` opens a viewer for the database.

## Deployment

- **Neon:** one Postgres database, shared by local development and the live site.
- **Render (backend):** web service with root directory `server`, build command `npm install`, start command `npm start`. The environment variables above are set in its dashboard.
- **Vercel (frontend):** root directory `client`, detected as Vite. `client/vercel.json` rewrites `/api/*` to the Render address.
- **Stripe:** a webhook endpoint in the Stripe dashboard points at `https://<render-address>/api/stripe/webhook` and listens for `checkout.session.completed` and `checkout.session.expired`. Its signing secret is the `STRIPE_WEBHOOK_SECRET` set on Render.
- Both hosts redeploy automatically when `main` changes on GitHub.

## Security

- `.env` is excluded from Git, and only `.env.example` is committed. Secrets, including the Stripe keys, are set in the hosts' dashboards.
- Passwords are stored as one-way hashes, and sessions use a cookie that JavaScript cannot read.
- Prices, deposits and capacity are checked on the server, never trusted from the browser.
- Stripe webhooks are only accepted when their signature is valid.
- Card details are entered on Stripe's hosted page and never reach this app.

## Notes

- Payments use Stripe test mode only.
- Do not run `npm run db:seed` after real bookings or orders exist, because it empties the menu table that they point to.

## Author

[Your name], [Group name]