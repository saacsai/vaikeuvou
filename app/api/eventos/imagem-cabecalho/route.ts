import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const COST = 1

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const form       = await req.formData()
  const editToken  = form.get('edit_token') as string | null
  const file       = form.get('imagem') as File | null
  if (!editToken || !file) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })

  const sb = getSupabaseAdmin()
  const { data: evento } = await sb
    .from('events')
    .select('id, title, user_id, bg_image_url')
    .eq('edit_token', editToken)
    .single()

  if (!evento) return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 })
  if (evento.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Esse convite não é seu.' }, { status: 403 })
  }

  // Primeira foto própria de um convite é grátis (diferencial) — só trocar
  // uma foto que já existe custa crédito.
  const isFirstUpload = !evento.bg_image_url || !evento.bg_image_url.includes('/event-headers/')

  if (!isFirstUpload) {
    const { data: debited } = await sb.rpc('debit_user_credits', {
      p_user_id: session.user_id,
      p_amount: COST,
    })
    if (!debited) {
      return NextResponse.json({ error: 'Créditos insuficientes.' }, { status: 402 })
    }
  }

  const path  = `${evento.id}/header-${Date.now()}.jpg`
  const bytes = await file.arrayBuffer()

  const { error: upErr } = await sb.storage
    .from('event-headers')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })

  if (upErr) {
    // Upload falhou depois de já ter debitado — devolve o crédito.
    if (!isFirstUpload) {
      await sb.rpc('increment_user_credits', { p_user_id: session.user_id, p_amount: COST })
    }
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = sb.storage.from('event-headers').getPublicUrl(path)

  await sb.from('events').update({ bg_image_url: publicUrl }).eq('id', evento.id)

  if (!isFirstUpload) {
    await sb.from('credit_transactions').insert({
      user_id: session.user_id,
      amount: -COST,
      type: 'debit',
      reason: `Trocar imagem de cabeçalho — ${evento.title}`,
      event_id: evento.id,
    })
  }

  return NextResponse.json({ ok: true, url: publicUrl, charged: !isFirstUpload })
}
