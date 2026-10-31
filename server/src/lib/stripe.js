import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing from server/.env')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// The server decides every price. Change these in one place.
export const CURRENCY = 'zar' // switch to 'usd' if Stripe rejects it for your account
export const DEPOSIT_PER_GUEST_CENTS = 5000 // R50.00 per guest
export const HOLD_MINUTES = 35 // how long the Stripe payment page stays open