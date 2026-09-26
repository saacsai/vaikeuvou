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

  const allowed = ['external_url', 'external_url_label', 'video_url', 'title', 'location', 'description', 'event_date', 'event_date_fim', 'duration_minutes', 'bg_image_url', 'max_depth', 'cidade', 'valor', 'descricao_pacote', 'programacao', 'max_parcelas']
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
  let evento: { id: string; event_date: string; date_changes_count: number; location: string | null; description: string | null; cidade: string | null; valor: number | null; slug: string; title: string; divulgar_blog: boolean } | null = null
  if ('event_date' in updates || 'divulgar_blog' in updates) {
    const { data } = await sb
      .from('events')
      .select('id, event_date, date_changes_count, location, description, cidade, valor, slug, title, divulgar_blog')
      .eq('edit_token', edit_token)
      .single()
    evento = data
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
