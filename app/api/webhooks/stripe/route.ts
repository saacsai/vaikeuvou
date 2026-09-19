import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import type Stripe from 'stripe'

// Confirma pagamento de evento pago (rateio/ticket) e só aí cria o RSVP —
// ver /api/rsvp/checkout, que abre o checkout sem gravar nada antes.
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
    const meta = session.metadata
    const eventId  = meta?.event_id
    const userName = meta?.user_name
    const userPhone = meta?.user_phone

    if (eventId && userName && userPhone) {
      const sb = getSupabaseAdmin()

      const { data: existing } = await sb
        .from('rsvps')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (!existing) {
        await sb.from('rsvps').insert({
          event_id:        eventId,
          user_name:       userName,
          user_phone:      userPhone,
          parent_rsvp_id:  meta?.parent_rsvp_id || null,
          pago:            true,
          valor_pago:      (session.amount_total ?? 0) / 100,
          stripe_session_id: session.id,
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
