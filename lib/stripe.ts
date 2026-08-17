import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export const CREDIT_PACKAGES = [
  { credits: 10,  price_cents: 1990, label: '10 créditos' },
  { credits: 20,  price_cents: 2990, label: '20 créditos' },
  { credits: 50,  price_cents: 5990, label: '50 créditos' },
  { credits: 100, price_cents: 9990, label: '100 créditos' },
] as const

export type CreditPackage = typeof CREDIT_PACKAGES[number]
