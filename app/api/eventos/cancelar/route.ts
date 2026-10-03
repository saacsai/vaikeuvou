import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { enviarWhatsapp } from '@/lib/evolution'

// Cancela o evento de vez — diferente do "Cancelar" do painel de quórum
// (que é sobre não ter atingido o mínimo antes do prazo), esse é o
// organizador decidindo cancelar por qualquer motivo, a qualquer momento.
//
// IMPORTANTE: reembolso de quem pagou NÃO é automático (decisão explícita
// 2026-10-03, ver sessão de brainstorming sobre retenção/split MP) — só
// avisa por WhatsApp e sinaliza na resposta quantas pessoas pagaram, pra
// o organizador processar o estorno manualmente pelo Mercado Pago.
export async function POST(req: NextRequest) {
  const { edit_token, motivo } = await req.json()
  if (!edit_token) return NextResponse.json({ error: 'edit_token obrigatório' }, { status: 400 })
  if (!motivo?.trim()) return NextResponse.json({ error: 'Informe o motivo do cancelamento.' }, { status: 400 })

  const sb = getSupabaseAdmin()

  const { data: evento } = await sb
    .from('events')
    .select('id, title, cancelado_em')
    .eq('edit_token', edit_token)
    .single()

  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  if (evento.cancelado_em) return NextResponse.json({ error: 'Evento já estava cancelado.' }, { status: 400 })

  const { error } = await sb
    .from('events')
    .update({ cancelado_em: new Date().toISOString(), motivo_cancelamento: motivo.trim() })
    .eq('edit_token', edit_token)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: rsvps } = await sb
    .from('rsvps')
    .select('user_phone, pago')
    .eq('event_id', evento.id)

  const lista = rsvps ?? []
  const pagos = lista.filter(r => r.pago)

  if (lista.length > 0) {
    const texto = `⚠️ O evento "${evento.title}" foi cancelado.\n\nMotivo: ${motivo.trim()}${
      pagos.length > 0 ? '\n\nComo você já pagou, o organizador vai processar o reembolso em breve.' : ''
    }\n\nDúvidas: fale@vaikeuvou.app`
    await Promise.all(lista.map(r => enviarWhatsapp(r.user_phone, texto)))
  }

  return NextResponse.json({ ok: true, avisados: lista.length, pagos: pagos.length })
}
