import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const COST = 3

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { generation_id } = await req.json()
  if (!generation_id) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })

  const sb = getSupabaseAdmin()

  const { data: generation } = await sb
    .from('ai_image_generations')
    .select('id, user_id, event_id, storage_path, status')
    .eq('id', generation_id)
    .single()

  if (!generation || generation.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Geração não encontrada.' }, { status: 404 })
  }
  if (generation.status !== 'pending') {
    return NextResponse.json({ error: 'Essa geração já foi resolvida.' }, { status: 409 })
  }

  await sb.rpc('increment_user_credits', { p_user_id: session.user_id, p_amount: COST })
  await sb.from('credit_transactions').insert({
    user_id: session.user_id,
    amount: COST,
    type: 'refund',
    reason: 'Imagem por IA recusada',
    event_id: generation.event_id,
  })
  await sb.from('ai_image_generations').update({ status: 'rejected' }).eq('id', generation_id)
  await sb.storage.from('event-headers').remove([generation.storage_path])

  return NextResponse.json({ ok: true })
}
