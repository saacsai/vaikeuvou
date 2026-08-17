import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getStripe, CREDIT_PACKAGES } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { credits } = await req.json()
  const pkg = CREDIT_PACKAGES.find(p => p.credits === credits)
  if (!pkg) return NextResponse.json({ error: 'Pacote inválido.' }, { status: 400 })

  const stripe = getStripe()
  const origin = req.nextUrl.origin

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: { name: `${pkg.label} — vaikeuvou.app` },
        unit_amount: pkg.price_cents,
      },
      quantity: 1,
    }],
    metadata: { user_id: session.user_id, credits: String(pkg.credits) },
    success_url: `${origin}/creditos?success=1`,
    cancel_url: `${origin}/creditos?canceled=1`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
