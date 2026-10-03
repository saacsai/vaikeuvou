import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { geocodeAddress } from '@/lib/geocode'
import { composeVamoAiBrief } from '@/lib/blogBrief'

function saoPauloDateOnly(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso))
}

export async function PATCH(req: NextRequest) {
  const { edit_token, ...fields } = await req.json()
  if (!edit_token) return NextResponse.json({ error: 'edit_token obrigatório' }, { status: 400 })

  const allowed = ['external_url', 'external_url_label', 'video_url', 'title', 'location', 'description', 'event_date', 'event_date_fim', 'duration_minutes', 'bg_image_url', 'max_depth', 'cidade', 'valor', 'descricao_pacote', 'programacao', 'max_parcelas', 'vagas_minimas', 'vagas_maximas', 'data_viabilizacao', 'organizador_nome', 'organizador_descricao', 'organizador_endereco', 'organizador_contato', 'organizador_horario', 'organizador_link']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in fields) updates[key] = fields[key] || null
  }
  // Booleano: `false || null` cairia em null, então trata à parte do loop
  // genérico acima (que assume string/number).
  if ('divulgar_blog' in fields) updates.divulgar_blog = !!fields.divulgar_blog
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

  const sb = getSupabaseAdmin()

  // Busca o evento atual sempre que algum dado dele for necessário pra decidir
  // a atualização: contagem de troca de data e/ou entrada na fila editorial.
  let evento: { id: string; event_date: string; date_changes_count: number; location: string | null; description: string | null; cidade: string | null; valor: number | null; slug: string; title: string; divulgar_blog: boolean; organizador_nome: string | null; organizador_descricao: string | null; organizador_endereco: string | null; organizador_contato: string | null; organizador_horario: string | null; organizador_link: string | null } | null = null
  if ('event_date' in updates || 'divulgar_blog' in updates) {
    const { data } = await sb
      .from('events')
      .select('id, event_date, date_changes_count, location, description, cidade, valor, slug, title, divulgar_blog, organizador_nome, organizador_descricao, organizador_endereco, organizador_contato, organizador_horario, organizador_link')
      .eq('edit_token', edit_token)
      .single()
    evento = data
  }

  // #VamoAí? precisa do nome do organizador pra creditar no post — se está
  // ativando divulgação agora e nem o dado novo nem o já salvo tem isso,
  // bloqueia (mesma regra de /api/eventos na criação).
  if (updates.divulgar_blog === true) {
    const nomeOrganizador = (updates.organizador_nome as string | null) ?? evento?.organizador_nome
    if (!nomeOrganizador?.trim()) {
      return NextResponse.json({ error: 'Preencha o nome do organizador pra divulgar no blog.' }, { status: 400 })
    }
  }

  // Troca de data é livre, sem limite — só registramos a contagem por
  // histórico. Só o dia conta — trocar o horário mantendo o mesmo dia não
  // incrementa nada.
  if ('event_date' in updates && evento) {
    const changed = saoPauloDateOnly(evento.event_date) !== saoPauloDateOnly(updates.event_date as string)
    if (changed) {
      updates.date_changes_count = evento.date_changes_count + 1
    }
  }

  const { error } = await sb.from('events').update(updates).eq('edit_token', edit_token)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Entra na fila editorial pra virar post #VamoAí? quando o opt-in é ativado
  // por aqui (evento editado depois de criado). Só insere se ainda não tinha
  // sido marcado antes, pra não duplicar pauta a cada salvamento do form.
  if (updates.divulgar_blog === true && evento && !evento.divulgar_blog) {
    await sb.from('blog_briefs').insert({
      tipo: 'VamoAi',
      titulo: evento.title,
      ideias_centrais: composeVamoAiBrief({
        event_date: (updates.event_date as string) ?? evento.event_date,
        location: (updates.location as string | null) ?? evento.location,
        description: (updates.description as string | null) ?? evento.description,
        cidade: (updates.cidade as string | null) ?? evento.cidade,
        valor: (updates.valor as number | null) ?? evento.valor,
        slug: evento.slug,
        organizador_nome: (updates.organizador_nome as string | null) ?? evento.organizador_nome,
        organizador_descricao: (updates.organizador_descricao as string | null) ?? evento.organizador_descricao,
        organizador_endereco: (updates.organizador_endereco as string | null) ?? evento.organizador_endereco,
        organizador_contato: (updates.organizador_contato as string | null) ?? evento.organizador_contato,
        organizador_horario: (updates.organizador_horario as string | null) ?? evento.organizador_horario,
        organizador_link: (updates.organizador_link as string | null) ?? evento.organizador_link,
      }),
      status: 'pendente',
      event_id: evento.id,
    })
  }

  // Geocodificação best-effort — reprocessa lat/lng quando o endereço muda.
  if (updates.location) {
    const geo = await geocodeAddress(updates.location as string)
    if (geo) await sb.from('events').update({ lat: geo.lat, lng: geo.lng }).eq('edit_token', edit_token)
  }

  return NextResponse.json({ ok: true })
}
