import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Assinatura ausente.' }, { status: 400 })

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId  = session.metadata?.user_id
    const credits = Number(session.metadata?.credits)

    if (userId && credits) {
      const sb = getSupabaseAdmin()

      const { data: existing } = await sb
        .from('credit_transactions')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (!existing) {
        await sb.from('credit_transactions').insert({
          user_id: userId,
          amount: credits,
          type: 'purchase',
          reason: `Compra de ${credits} créditos`,
          stripe_session_id: session.id,
        })
        await sb.rpc('increment_user_credits', { p_user_id: userId, p_amount: credits })
      }
    }
  }

  return NextResponse.json({ received: true })
}
