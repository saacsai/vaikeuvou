import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Nível 1 de atribuição pro checkout externo (discutido na sessão de
// brainstorming 2026-10-03): não confirma conversão, só registra que
// alguém clicou no link externo vindo do vaikeuvou. Sem autenticação —
// é clique público, mesmo padrão de outras métricas abertas do app.
export async function POST(req: NextRequest) {
  const { event_id } = await req.json()
  if (!event_id) return NextResponse.json({ error: 'event_id obrigatório' }, { status: 400 })

  const sb = getSupabaseAdmin()
  await sb.from('event_external_clicks').insert({ event_id })

  return NextResponse.json({ ok: true })
}
