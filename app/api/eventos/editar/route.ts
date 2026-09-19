import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { geocodeAddress } from '@/lib/geocode'

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
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

  const sb = getSupabaseAdmin()

  // Troca de data é livre, sem limite — só registramos a contagem por
  // histórico. Só o dia conta — trocar o horário mantendo o mesmo dia não
  // incrementa nada.
  if ('event_date' in updates) {
    const { data: evento } = await sb
      .from('events')
      .select('event_date, date_changes_count')
      .eq('edit_token', edit_token)
      .single()

    const changed = evento && saoPauloDateOnly(evento.event_date) !== saoPauloDateOnly(updates.event_date as string)
    if (changed) {
      updates.date_changes_count = evento!.date_changes_count + 1
    }
  }

  const { error } = await sb.from('events').update(updates).eq('edit_token', edit_token)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Geocodificação best-effort — reprocessa lat/lng quando o endereço muda.
  if (updates.location) {
    const geo = await geocodeAddress(updates.location as string)
    if (geo) await sb.from('events').update({ lat: geo.lat, lng: geo.lng }).eq('edit_token', edit_token)
  }

  return NextResponse.json({ ok: true })
}
