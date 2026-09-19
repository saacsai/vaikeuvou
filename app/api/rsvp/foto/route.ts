import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Personalização em cascata: a foto de quem confirmou/reenviou o convite —
// não exige sessão, o rsvp_id em si é a credencial (mesmo padrão do
// edit_token de evento, só quem confirmou tem essa string em mãos).
export async function POST(req: NextRequest) {
  const form   = await req.formData()
  const rsvpId = form.get('rsvp_id') as string | null
  const file   = form.get('avatar') as File | null
  if (!rsvpId || !file) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })

  const sb = getSupabaseAdmin()
  const { data: rsvp } = await sb.from('rsvps').select('id').eq('id', rsvpId).single()
  if (!rsvp) return NextResponse.json({ error: 'Confirmação não encontrada.' }, { status: 404 })

  const path  = `rsvp/${rsvpId}.jpg`
  const bytes = await file.arrayBuffer()

  const { error: upErr } = await sb.storage
    .from('event-headers')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = sb.storage.from('event-headers').getPublicUrl(path)

  await sb.from('rsvps').update({ foto_url: publicUrl }).eq('id', rsvpId)

  return NextResponse.json({ ok: true, url: publicUrl })
}
