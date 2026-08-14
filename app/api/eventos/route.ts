import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateSlug, fmtPhone } from '@/lib/slug'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { title, event_date, location, description, creator_phone, max_depth } = await req.json()

  if (!title || !event_date || !creator_phone) {
    return NextResponse.json({ error: 'título, data e telefone são obrigatórios' }, { status: 400 })
  }

  const phone = fmtPhone(creator_phone)
  if (phone.length < 10 || phone.length > 15) {
    return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  // Gera slug único (retry em caso de colisão)
  let slug = generateSlug(title)
  let tentativas = 0
  while (tentativas < 3) {
    const { data: existente } = await sb.from('events').select('id').eq('slug', slug).single()
    if (!existente) break
    slug = generateSlug(title)
    tentativas++
  }

  const session = await getSession()

  const { data, error } = await sb
    .from('events')
    .insert({
      title,
      slug,
      event_date,
      location:      location || null,
      description:   description || null,
      max_depth:     max_depth ?? 2,
      creator_phone: phone,
      user_id:       session?.user_id ?? null,
    })
    .select('id, slug, edit_token')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao criar evento' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, slug: data.slug, edit_token: data.edit_token })
}
