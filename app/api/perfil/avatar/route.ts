import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('avatar') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório.' }, { status: 400 })

  const ext      = file.name.split('.').pop() ?? 'jpg'
  const path     = `${session.user_id}/avatar.${ext}`
  const buffer   = Buffer.from(await file.arrayBuffer())
  const sb       = getSupabaseAdmin()

  const { error: upErr } = await sb.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path)

  await sb.from('users').update({ avatar_url: publicUrl }).eq('id', session.user_id)

  return NextResponse.json({ ok: true, avatar_url: publicUrl })
}
