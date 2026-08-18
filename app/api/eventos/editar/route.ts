import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  const { edit_token, ...fields } = await req.json()
  if (!edit_token) return NextResponse.json({ error: 'edit_token obrigatório' }, { status: 400 })

  const allowed = ['external_url', 'external_url_label', 'video_url', 'title', 'location', 'description', 'event_date', 'bg_image_url', 'max_depth']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in fields) updates[key] = fields[key] || null
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

  const sb = getSupabaseAdmin()

  // Troca de data: primeira é grátis, da segunda em diante o crédito já foi
  // debitado antes (via /api/creditos/desbloquear-data) — aqui só contamos.
  if ('event_date' in updates) {
    const { data: evento } = await sb
      .from('events')
      .select('event_date, date_changes_count')
      .eq('edit_token', edit_token)
      .single()

    const changed = evento && new Date(evento.event_date).getTime() !== new Date(updates.event_date as string).getTime()
    if (changed) {
      updates.date_changes_count = evento!.date_changes_count + 1
    }
  }

  const { error } = await sb.from('events').update(updates).eq('edit_token', edit_token)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
