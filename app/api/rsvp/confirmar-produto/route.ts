import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Organizador confirma, no dia do evento, que a pessoa realmente trouxe o
// produto combinado — mesmo padrão de autenticação por edit_token já usado
// em /api/eventos/cancelar (sem sessão própria, o token É a permissão).
export async function POST(req: NextRequest) {
  const { edit_token, rsvp_id } = await req.json()
  if (!edit_token || !rsvp_id) {
    return NextResponse.json({ error: 'edit_token e rsvp_id são obrigatórios' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  const { data: evento } = await sb.from('events').select('id').eq('edit_token', edit_token).single()
  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

  const { data: rsvp } = await sb.from('rsvps').select('id, event_id').eq('id', rsvp_id).single()
  if (!rsvp || rsvp.event_id !== evento.id) {
    return NextResponse.json({ error: 'Confirmação não encontrada para esse evento' }, { status: 404 })
  }

  const { error } = await sb
    .from('rsvps')
    .update({ produto_confirmado: true, produto_confirmado_em: new Date().toISOString() })
    .eq('id', rsvp_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
