import { NextRequest, NextResponse } from 'next/server'
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getOrderClient } from '@/lib/mercadopago'

type ExternalRef = {
  event_id: string
  user_name: string
  user_phone: string
  parent_rsvp_id: string | null
}

// Notificação do MP manda só o id do recurso — a gente busca os dados
// completos depois (GET /v1/orders/{id}), nunca confia no corpo do POST.
export async function POST(req: NextRequest) {
  const dataId    = req.nextUrl.searchParams.get('data.id') ?? req.nextUrl.searchParams.get('id')
  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')

  try {
    WebhookSignatureValidator.validate({
      xSignature,
      xRequestId,
      dataId,
      secret: process.env.MP_WEBHOOK_SECRET!,
    })
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })
    }
    throw err
  }

  const body = await req.json().catch(() => null)
  const topic = req.nextUrl.searchParams.get('topic') ?? body?.type
  if (topic !== 'order' || !dataId) {
    // Outros tópicos (split, etc.) — reconhece mas não processa ainda.
    return NextResponse.json({ ok: true })
  }

  const sb = getSupabaseAdmin()

  // Idempotência: se já processamos esse pagamento, não duplica.
  const { data: jaExiste } = await sb.from('rsvps').select('id').eq('mp_payment_id', dataId).single()
  if (jaExiste) return NextResponse.json({ ok: true })

  const refBruto = body?.external_reference ?? null
  if (!refBruto) return NextResponse.json({ ok: true })

  let ref: ExternalRef
  try {
    ref = JSON.parse(Buffer.from(refBruto, 'base64').toString('utf-8'))
  } catch {
    return NextResponse.json({ ok: true })
  }

  // A order é escopada pro vendedor que a criou — busca o token do
  // organizador no nosso próprio banco (nunca transita pelo MP).
  const { data: evento } = await sb.from('events').select('user_id').eq('id', ref.event_id).single()
  const { data: organizador } = evento?.user_id
    ? await sb.from('users').select('mp_access_token').eq('id', evento.user_id).single()
    : { data: null }
  if (!organizador?.mp_access_token) return NextResponse.json({ ok: true })

  const order = await getOrderClient(organizador.mp_access_token).get({ id: dataId })
  if (order.status !== 'processed') return NextResponse.json({ ok: true })

  const { error } = await sb.from('rsvps').insert({
    event_id:       ref.event_id,
    user_name:      ref.user_name,
    user_phone:     ref.user_phone,
    parent_rsvp_id: ref.parent_rsvp_id || null,
    pago:           true,
    valor_pago:     order.total_paid_amount ? Number(order.total_paid_amount) : null,
    mp_payment_id:  dataId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
