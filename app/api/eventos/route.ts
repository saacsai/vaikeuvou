import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateSlug } from '@/lib/slug'
import { getSession } from '@/lib/auth'
import { geocodeAddress } from '@/lib/geocode'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const {
    title, event_date, event_date_fim, duration_minutes, location, description, max_depth, bg_image_url,
    video_url, external_url, external_url_label, cidade,
    valor, descricao_pacote, programacao, max_parcelas, divulgar_blog,
  } = await req.json()

  if (!title || !event_date) {
    return NextResponse.json({ error: 'título e data são obrigatórios' }, { status: 400 })
  }

  const phone = session.users.phone
  const sb    = getSupabaseAdmin()

  // Comissão não é definida pelo organizador — é combinada por cliente no
  // admin (app/admin/usuarios). Sem configuração, cobra o padrão de 15%.
  const { data: usuario } = await sb
    .from('users')
    .select('comissao_percentual')
    .eq('id', session.user_id)
    .single()
  const comissaoPercentual = usuario?.comissao_percentual ?? 15

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
      event_date_fim:       event_date_fim || null,
      duration_minutes:     duration_minutes || null,
      location:            location || null,
      description:         description || null,
      max_depth:            max_depth ?? 2,
      bg_image_url:         bg_image_url || null,
      video_url:            video_url || null,
      external_url:         external_url || null,
      external_url_label:   external_url_label || null,
      cidade:               cidade || null,
      valor:                valor || null,
      descricao_pacote:     descricao_pacote || null,
      programacao:          programacao || null,
      comissao_percentual:  comissaoPercentual,
      max_parcelas:         max_parcelas || 3,
      // Opt-in de divulgação no blog só faz sentido pra evento "Aberto"
      // (max_depth 999) — ignora silenciosamente se vier true sem isso.
      divulgar_blog:        (max_depth ?? 2) === 999 ? !!divulgar_blog : false,
      creator_phone: phone,
      user_id:       session.user_id,
    })
    .select('id, slug, edit_token')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao criar evento' }, { status: 500 })
  }

  // Geocodificação best-effort — usada só pra verificar proximidade no
  // check-in, nunca bloqueia a criação do evento se falhar.
  if (location) {
    const geo = await geocodeAddress(location)
    if (geo) await sb.from('events').update({ lat: geo.lat, lng: geo.lng }).eq('id', data.id)
  }

  return NextResponse.json({ ok: true, slug: data.slug, edit_token: data.edit_token })
}
