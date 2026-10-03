import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { enviarWhatsapp } from '@/lib/evolution'
import { fmtDate } from '@/lib/slug'

// Adiar é mais simples que cancelar: ninguém precisa de reembolso (quem já
// confirmou mantém a vaga pra nova data, padrão do mundo real) — só avisa.
// nova_data é opcional: sem ela, marca data_a_definir=true (bloqueia nova
// confirmação até alguém editar a data de verdade).
export async function POST(req: NextRequest) {
  const { edit_token, motivo, nova_data } = await req.json()
  if (!edit_token) return NextResponse.json({ error: 'edit_token obrigatório' }, { status: 400 })
  if (!motivo?.trim()) return NextResponse.json({ error: 'Informe o motivo do adiamento.' }, { status: 400 })

  const sb = getSupabaseAdmin()

  const { data: evento } = await sb
    .from('events')
    .select('id, title, event_date, cancelado_em')
    .eq('edit_token', edit_token)
    .single()

  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  if (evento.cancelado_em) return NextResponse.json({ error: 'Evento está cancelado, não dá pra adiar.' }, { status: 400 })

  const updates: Record<string, unknown> = {
    adiado_em: new Date().toISOString(),
    motivo_adiamento: motivo.trim(),
    data_a_definir: !nova_data,
  }
  if (nova_data) updates.event_date = nova_data

  const { error } = await sb.from('events').update(updates).eq('edit_token', edit_token)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: rsvps } = await sb.from('rsvps').select('user_phone').eq('event_id', evento.id)
  const lista = rsvps ?? []

  if (lista.length > 0) {
    const dataTxt = nova_data ? `Nova data: ${fmtDate(nova_data)}.` : 'Nova data ainda a definir — avisaremos em breve.'
    const texto = `📅 O evento "${evento.title}" foi adiado.\n\nMotivo: ${motivo.trim()}\n\n${dataTxt}\n\nSua presença continua confirmada, não precisa fazer nada.`
    await Promise.all(lista.map(r => enviarWhatsapp(r.user_phone, texto)))
  }

  return NextResponse.json({ ok: true, avisados: lista.length })
}
