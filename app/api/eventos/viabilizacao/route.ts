import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Confirma ou cancela a viabilização do evento (quórum mínimo atingido ou
// não) — decisão sempre do organizador, nunca automática (ver sessão de
// brainstorming 2026-10-03). Só grava o timestamp da decisão aqui.
//
// IMPORTANTE — fora do escopo desta rota: a retenção/liberação do repasse
// MP e o reembolso automático em caso de cancelamento ainda não estão
// integrados aqui. Isso depende de verificar a API real de retenção de
// split do Mercado Pago antes de implementar (ainda não feito) — por ora
// esta rota só registra a decisão do organizador.
export async function POST(req: NextRequest) {
  const { edit_token, acao } = await req.json()

  if (!edit_token) return NextResponse.json({ error: 'edit_token obrigatório' }, { status: 400 })
  if (acao !== 'confirmar' && acao !== 'cancelar') {
    return NextResponse.json({ error: 'ação inválida' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  const { data: evento } = await sb
    .from('events')
    .select('id, vagas_minimas, viabilizacao_confirmada_em, cancelado_em')
    .eq('edit_token', edit_token)
    .single()

  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  if (evento.cancelado_em) return NextResponse.json({ error: 'Evento já foi cancelado.' }, { status: 400 })
  if (evento.viabilizacao_confirmada_em) return NextResponse.json({ error: 'Evento já foi confirmado.' }, { status: 400 })

  const campo = acao === 'confirmar' ? 'viabilizacao_confirmada_em' : 'cancelado_em'

  const { error } = await sb
    .from('events')
    .update({ [campo]: new Date().toISOString() })
    .eq('edit_token', edit_token)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
