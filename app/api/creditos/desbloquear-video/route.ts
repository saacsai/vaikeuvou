import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const COST = 1

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { edit_token } = await req.json()
  if (!edit_token) return NextResponse.json({ error: 'edit_token obrigatório.' }, { status: 400 })

  const sb = getSupabaseAdmin()
  const { data: evento } = await sb
    .from('events')
    .select('id, title, user_id')
    .eq('edit_token', edit_token)
    .single()

  if (!evento) return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 })
  if (evento.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Esse convite não é seu.' }, { status: 403 })
  }

  const { data: debited } = await sb.rpc('debit_user_credits', {
    p_user_id: session.user_id,
    p_amount: COST,
  })

  if (!debited) {
    return NextResponse.json({ error: 'Créditos insuficientes.' }, { status: 402 })
  }

  await sb.from('credit_transactions').insert({
    user_id: session.user_id,
    amount: -COST,
    type: 'debit',
    reason: `Trocar vídeo — ${evento.title}`,
    event_id: evento.id,
  })

  return NextResponse.json({ ok: true })
}
