import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizePhone } from '@/lib/auth'

// Evento pago: confirmar presença (BORA) exige pagamento antes de confirmar de
// verdade. O RSVP só é criado no webhook (checkout.session.completed) — aqui só
// validamos e abrimos o checkout, nada é gravado ainda (evita linha "pendente"
// órfã se a pessoa abandonar o pagamento).
export async function POST(req: NextRequest) {
  const { event_id, user_name, user_phone, parent_rsvp_id } = await req.json()

  if (!event_id || !user_name || !user_phone) {
    return NextResponse.json({ error: 'event_id, nome e telefone são obrigatórios' }, { status: 400 })
  }

  const phone = normalizePhone(user_phone)
  if (phone.length < 12 || phone.length > 13) {
    return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  const { data: evento } = await sb
    .from('events')
    .select('id, slug, title, max_depth, valor')
    .eq('id', event_id)
    .single()

  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  if (!evento.valor || evento.valor <= 0) {
    return NextResponse.json({ error: 'Esse evento não tem valor definido' }, { status: 400 })
  }

  if (parent_rsvp_id) {
    const { data: pai } = await sb
      .from('rsvps')
      .select('depth_level')
      .eq('id', parent_rsvp_id)
      .single()

    if (pai && pai.depth_level >= evento.max_depth) {
      return NextResponse.json({ error: 'Limite de convites atingido para este evento' }, { status: 403 })
    }
  }

  const { data: jaConfirmou } = await sb
    .from('rsvps')
    .select('id')
    .eq('event_id', event_id)
    .eq('user_phone', phone)
    .single()

  if (jaConfirmou) {
    return NextResponse.json({ ok: true, rsvp_id: jaConfirmou.id, ja_confirmado: true })
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://live.vaikeuvou.app'
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: { name: evento.title },
        unit_amount: Math.round(evento.valor * 100),
      },
      quantity: 1,
    }],
    metadata: {
      event_id,
      user_name: user_name.trim(),
      user_phone: phone,
      parent_rsvp_id: parent_rsvp_id || '',
    },
    success_url: `${base}/e/${evento.slug}?rsvp_ok=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/e/${evento.slug}`,
  })

  return NextResponse.json({ ok: true, url: session.url })
}
