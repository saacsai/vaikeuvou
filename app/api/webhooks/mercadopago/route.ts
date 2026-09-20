import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'

// Validação manual da assinatura — o WebhookSignatureValidator oficial do SDK
// não converte o id pra minúsculo antes de montar o manifest, e a Mercado
// Pago exige isso (o id de uma order tem letras maiúsculas, tipo
// "ORD01M2ZB6..." — sem lowercase o hash nunca bate, sempre dá 401).
function assinaturaValida(xSignature: string | null, xRequestId: string | null, dataId: string | null, secret: string): boolean {
  if (!xSignature || !dataId) return false

  const partes: Record<string, string> = {}
  for (const par of xSignature.split(',')) {
    const [k, v] = par.split('=')
    if (k && v) partes[k.trim()] = v.trim()
  }
  const ts = partes.ts
  const hash = partes.v1
  if (!ts || !hash) return false

  const manifest = `id:${dataId.toLowerCase()};${xRequestId ? `request-id:${xRequestId};` : ''}ts:${ts};`
  const esperado = createHmac('sha256', secret).update(manifest).digest('hex')

  const a = Buffer.from(hash)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

// O corpo da notificação já traz external_reference, user_id e o status
// completo da order — não precisa fazer uma segunda chamada de GET.
export async function POST(req: NextRequest) {
  const dataId     = req.nextUrl.searchParams.get('data.id') ?? req.nextUrl.searchParams.get('id')
  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')

  if (!assinaturaValida(xSignature, xRequestId, dataId, process.env.MP_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const topic = req.nextUrl.searchParams.get('topic') ?? body?.type

  const status            = body?.status ?? body?.data?.status
  const externalReference = body?.external_reference ?? body?.data?.external_reference
  const totalPaidAmount   = body?.total_paid_amount ?? body?.data?.total_paid_amount

  const sb = getSupabaseAdmin()

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

  // 23505 = viola a constraint única (event_id, user_phone) — dois checkouts
  // pro mesmo telefone foram iniciados antes do primeiro confirmar. Não é
  // erro nosso pra retornar 500 (a MP ficaria reenviando à toa); o pagamento
  // duplicado, se acontecer, precisa ser estornado manualmente pelo organizador.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await sb.from('rsvp_pendentes').delete().eq('id', externalReference)

  return NextResponse.json({ ok: true })
}
