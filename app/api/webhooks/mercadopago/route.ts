import { NextRequest, NextResponse } from 'next/server'
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase'

// O corpo da notificação já traz external_reference, user_id e o status
// completo da order — não precisa fazer uma segunda chamada de GET.
export async function POST(req: NextRequest) {
  const dataId     = req.nextUrl.searchParams.get('data.id') ?? req.nextUrl.searchParams.get('id')
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

  const status            = body?.status ?? body?.data?.status
  const externalReference = body?.external_reference ?? body?.data?.external_reference
  const totalPaidAmount   = body?.total_paid_amount ?? body?.data?.total_paid_amount

  const sb = getSupabaseAdmin()

  // DEBUG temporário — remover depois de confirmar o formato real do Pix.
  await sb.from('webhook_debug').insert({
    payload: { topic, dataId, status, externalReference, totalPaidAmount, query: Object.fromEntries(req.nextUrl.searchParams), body },
  })

  if (topic !== 'order' || !dataId || !body) {
    // Outros tópicos (split, etc.) — reconhece mas não processa ainda.
    return NextResponse.json({ ok: true })
  }

  if (status !== 'processed' || !externalReference) {
    return NextResponse.json({ ok: true })
  }

  // Idempotência: se já processamos esse pagamento, não duplica.
  const { data: jaExiste } = await sb.from('rsvps').select('id').eq('mp_payment_id', dataId).single()
  if (jaExiste) return NextResponse.json({ ok: true })

  const { data: pendente } = await sb
    .from('rsvp_pendentes')
    .select('event_id, user_name, user_phone, parent_rsvp_id')
    .eq('id', externalReference)
    .single()

  if (!pendente) return NextResponse.json({ ok: true })

  const { error } = await sb.from('rsvps').insert({
    event_id:       pendente.event_id,
    user_name:      pendente.user_name,
    user_phone:     pendente.user_phone,
    parent_rsvp_id: pendente.parent_rsvp_id,
    pago:           true,
    valor_pago:     totalPaidAmount ? Number(totalPaidAmount) : null,
    mp_payment_id:  dataId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sb.from('rsvp_pendentes').delete().eq('id', externalReference)

  return NextResponse.json({ ok: true })
}
