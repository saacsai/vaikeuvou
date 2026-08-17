import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateSlug } from '@/lib/slug'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const {
    title, event_date, location, description, max_depth, bg_image_url,
    video_url, external_url, external_url_label,
  } = await req.json()

  if (!title || !event_date) {
    return NextResponse.json({ error: 'título e data são obrigatórios' }, { status: 400 })
  }

  const phone = session.users.phone
  const sb    = getSupabaseAdmin()

  let slug      = generateSlug(title)
  let tentativas = 0
  while (tentativas < 3) {
    const { data: existente } = await sb.from('events').select('id').eq('slug', slug).single()
    if (!existente) break
    slug = generateSlug(title)
    tentativas++
  }

  const { data, error } = await sb
    .from('events')
    .insert({
      title,
      slug,
      event_date,
      location:            location || null,
      description:         description || null,
      max_depth:            max_depth ?? 2,
      bg_image_url:         bg_image_url || null,
      video_url:            video_url || null,
      external_url:         external_url || null,
      external_url_label:   external_url_label || null,
      creator_phone: phone,
      user_id:       session.user_id,
    })
    .select('id, slug, edit_token')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao criar evento' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, slug: data.slug, edit_token: data.edit_token })
}
