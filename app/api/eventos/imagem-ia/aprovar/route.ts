import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { edit_token, generation_id } = await req.json()
  if (!edit_token || !generation_id) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  const { data: evento } = await sb
    .from('events')
    .select('id, user_id')
    .eq('edit_token', edit_token)
    .single()

  if (!evento) return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 })
  if (evento.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Esse convite não é seu.' }, { status: 403 })
  }

  const { data: generation } = await sb
    .from('ai_image_generations')
    .select('id, user_id, url, status')
    .eq('id', generation_id)
    .single()

  if (!generation || generation.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Geração não encontrada.' }, { status: 404 })
  }
  if (generation.status !== 'pending') {
    return NextResponse.json({ error: 'Essa geração já foi resolvida.' }, { status: 409 })
  }

  await sb.from('events').update({ bg_image_url: generation.url }).eq('id', evento.id)
  await sb.from('ai_image_generations').update({ status: 'approved', event_id: evento.id }).eq('id', generation_id)

  return NextResponse.json({ ok: true, url: generation.url })
}
