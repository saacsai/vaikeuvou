import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateSlug } from '@/lib/slug'
import { getSession } from '@/lib/auth'
import { geocodeAddress } from '@/lib/geocode'
import { composeVamoAiBrief } from '@/lib/blogBrief'

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

  // Opt-in de divulgação no blog só faz sentido pra evento "Aberto"
  // (max_depth 999) — ignora silenciosamente se vier true sem isso.
  const divulgarBlogFinal = (max_depth ?? 2) === 999 ? !!divulgar_blog : false

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
      divulgar_blog:        divulgarBlogFinal,
      creator_phone: phone,
      user_id:       session.user_id,
    })
    .select('id, slug, edit_token')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao criar evento' }, { status: 500 })
  }

  // Entra na fila editorial pra virar post #VamoAí? — sem IA nenhuma aqui,
  // só compõe o brief a partir dos dados do evento (ver PERFIL_CRIADOR.md e
  // app/admin/pautas). O processamento de verdade é manual, via Claude Code.
  if (divulgarBlogFinal) {
    await sb.from('blog_briefs').insert({
      tipo: 'VamoAi',
      titulo: title,
      ideias_centrais: composeVamoAiBrief({ event_date, location, description, cidade, valor, slug: data.slug }),
      status: 'pendente',
      event_id: data.id,
    })
  }

  // Fecha qualquer geração de imagem por IA feita em /criar antes do evento
  // existir (por isso fica com event_id nulo até aqui) — sem isso, a
  // geração ficava "pending" pra sempre e reaparecia como recuperável na
  // criação do PRÓXIMO evento, mesmo já tendo sido usada (ou descartada)
  // neste. A que tiver a mesma URL usada como capa vira "approved" e ganha
  // o event_id; qualquer outra pendente do usuário vira "rejected" (o
  // upload em /criar só permite decidir uma imagem por vez, então nunca
  // deveria sobrar mais de uma, mas resolve todas por segurança).
  const { data: pendentes } = await sb
    .from('ai_image_generations')
    .select('id, url, storage_path')
    .eq('user_id', session.user_id)
    .eq('status', 'pending')
    .is('event_id', null)

  if (pendentes && pendentes.length > 0) {
    for (const gen of pendentes) {
      if (bg_image_url && gen.url === bg_image_url) {
        await sb.from('ai_image_generations').update({ status: 'approved', event_id: data.id }).eq('id', gen.id)
      } else {
        await sb.from('ai_image_generations').update({ status: 'rejected' }).eq('id', gen.id)
        await sb.storage.from('event-headers').remove([gen.storage_path])
      }
    }
  }

  // Geocodificação best-effort — usada só pra verificar proximidade no
  // check-in, nunca bloqueia a criação do evento se falhar.
  if (location) {
    const geo = await geocodeAddress(location)
    if (geo) await sb.from('events').update({ lat: geo.lat, lng: geo.lng }).eq('id', data.id)
  }

  return NextResponse.json({ ok: true, slug: data.slug, edit_token: data.edit_token })
}
