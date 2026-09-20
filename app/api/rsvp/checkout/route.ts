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
    .select('id, slug, title, max_depth, valor, max_parcelas, user_id')
    .eq('id', event_id)
    .single()

  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  if (!evento.valor || evento.valor <= 0) {
    return NextResponse.json({ error: 'Esse evento não tem valor definido' }, { status: 400 })
  }

  // Comissão sempre lida da conta do organizador no momento da venda (não
  // trava no valor de quando o evento foi criado) — admin pode ajustar em
  // /admin/usuarios e isso vale pra próxima venda na hora, não só eventos novos.
  const { data: organizador } = evento.user_id
    ? await sb.from('users').select('mp_access_token, comissao_percentual').eq('id', evento.user_id).single()
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

  // external_reference da MP tem limite de 64 caracteres — não cabe os dados
  // do RSVP codificados, então guarda numa tabela-ponte e usa só o id.
  const { data: pendente, error: erroPendente } = await sb
    .from('rsvp_pendentes')
    .insert({
      event_id,
      user_name: user_name.trim(),
      user_phone: phone,
      parent_rsvp_id: parent_rsvp_id || null,
    })
    .select('id')
    .single()

  if (erroPendente || !pendente) {
    return NextResponse.json({ error: 'Erro ao abrir pagamento. Tente novamente.' }, { status: 500 })
  }

  const valor = Number(evento.valor).toFixed(2)

  // "Parcelamento sem juros de 1x" não existe pra MP (1x é só pagamento à
  // vista) — só manda o bloco de installments quando fizer sentido de verdade.
  const maxParcelas = evento.max_parcelas || 1
  const paymentMethod = maxParcelas > 1
    ? {
        max_installments: 12,
        installments: {
          interest_free: {
            type: 'list' as const,
            values: Array.from({ length: maxParcelas }, (_, i) => i + 1),
          },
        },
      }
    : { max_installments: 1 }

  let order
  try {
    order = await getOrderClient(organizador.mp_access_token).create({
      body: {
        type: 'online',
        processing_mode: 'manual', // fixo pro Checkout Pro — não é aprovação manual nossa
        total_amount: valor,
        external_reference: pendente.id,
        description: evento.title,
        marketplace_fee: (Number(evento.valor) * (organizador.comissao_percentual ?? 15) / 100).toFixed(2),
        items: [{
          title: evento.title,
          unit_price: valor,
          quantity: 1,
        }],
        config: {
          statement_descriptor: 'VAIKEUVOU',
          online: {
            success_url: `${base}/e/${evento.slug}?rsvp_ok=1`,
            failure_url: `${base}/e/${evento.slug}`,
            pending_url: `${base}/e/${evento.slug}`,
            auto_return: 'approved',
            callback_url: `${base}/api/webhooks/mercadopago`,
          },
          payment_method: paymentMethod,
        },
      },
    })
  } catch (err) {
    const e = err as { status?: number; message?: string; error?: string; causes?: unknown }
    console.error('Erro ao criar order MP:', e.status, e.message, e.error, JSON.stringify(e.causes))
    return NextResponse.json({ error: 'Erro ao abrir pagamento. Tente novamente.' }, { status: 500 })
  }

  if (!order.checkout_url) {
    return NextResponse.json({ error: 'Erro ao abrir pagamento. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, url: order.checkout_url })
}
