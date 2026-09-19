import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

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
    .select('id, title, user_id')
    .eq('edit_token', editToken)
    .single()

  if (!evento) return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 })
  if (evento.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Esse convite não é seu.' }, { status: 403 })
  }

  const path  = `${evento.id}/header-${Date.now()}.jpg`
  const bytes = await file.arrayBuffer()

  const { error: upErr } = await sb.storage
    .from('event-headers')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = sb.storage.from('event-headers').getPublicUrl(path)

  await sb.from('events').update({ bg_image_url: publicUrl }).eq('id', evento.id)

  return NextResponse.json({ ok: true, url: publicUrl })
}
