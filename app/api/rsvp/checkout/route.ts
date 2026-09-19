import { NextRequest, NextResponse } from 'next/server'
import { getOrderClient } from '@/lib/mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizePhone } from '@/lib/auth'

// Evento pago: confirmar presença (BORA) exige pagamento antes de confirmar de
// verdade. O RSVP só é criado no webhook (order processada) — aqui só
// validamos e abrimos o checkout, nada é gravado ainda (evita linha "pendente"
// órfã se a pessoa abandonar o pagamento). A order é criada com o
// access_token do PRÓPRIO organizador — é isso que faz o split (marketplace_fee)
// cair direto na conta dele, menos a comissão vaikeuvou.
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
    .select('id, slug, title, max_depth, valor, max_parcelas, comissao_percentual, user_id')
    .eq('id', event_id)
    .single()

  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  if (!evento.valor || evento.valor <= 0) {
    return NextResponse.json({ error: 'Esse evento não tem valor definido' }, { status: 400 })
  }

  const { data: organizador } = evento.user_id
    ? await sb.from('users').select('mp_access_token').eq('id', evento.user_id).single()
    : { data: null }

  if (!organizador?.mp_access_token) {
    return NextResponse.json({ error: 'O organizador ainda não conectou uma conta de pagamento pra esse evento.' }, { status: 400 })
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

  const externalReference = Buffer.from(JSON.stringify({
    event_id,
    user_name: user_name.trim(),
    user_phone: phone,
    parent_rsvp_id: parent_rsvp_id || null,
  })).toString('base64')

  const valor = Number(evento.valor).toFixed(2)

  const order = await getOrderClient(organizador.mp_access_token).create({
    body: {
      type: 'online',
      processing_mode: 'manual', // fixo pro Checkout Pro — não é aprovação manual nossa
      total_amount: valor,
      external_reference: externalReference,
      description: evento.title,
      marketplace_fee: (Number(evento.valor) * (evento.comissao_percentual ?? 15) / 100).toFixed(2),
      items: [{
        title: evento.title,
        unit_price: valor,
        quantity: 1,
      }],
      config: {
        online: {
          success_url: `${base}/e/${evento.slug}?rsvp_ok=1`,
          failure_url: `${base}/e/${evento.slug}`,
          pending_url: `${base}/e/${evento.slug}`,
          auto_return: 'approved',
          callback_url: `${base}/api/webhooks/mercadopago`,
        },
        payment_method: {
          max_installments: 12,
          installments: {
            interest_free: {
              type: 'range',
              values: [1, evento.max_parcelas || 3],
            },
          },
        },
      },
    },
  })

  if (!order.checkout_url) {
    return NextResponse.json({ error: 'Erro ao abrir pagamento. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, url: order.checkout_url })
}
