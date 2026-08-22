import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { enviarWhatsapp } from '@/lib/evolution'

const REMINDER_DELAY_MS = 45 * 60 * 1000
// Janela de segurança — evita disparar lembrete pra evento muito antigo
// (ex: se o cron ficar fora do ar um tempo, ou no primeiro deploy dessa
// feature, quando existem eventos passados sem checkin_reminder_sent_at).
const SAFETY_WINDOW_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb  = getSupabaseAdmin()
  const now = Date.now()

  const { data: eventos } = await sb
    .from('events')
    .select('id, title')
    .is('checkin_reminder_sent_at', null)
    .lte('event_date', new Date(now - REMINDER_DELAY_MS).toISOString())
    .gte('event_date', new Date(now - SAFETY_WINDOW_MS).toISOString())

  let totalEnviados = 0

  for (const evento of eventos ?? []) {
    // Reivindica o evento condicionalmente — se outra execução do cron já
    // pegou, essa atualização não afeta nenhuma linha e a gente pula.
    const { data: claimed } = await sb
      .from('events')
      .update({ checkin_reminder_sent_at: new Date().toISOString() })
      .eq('id', evento.id)
      .is('checkin_reminder_sent_at', null)
      .select('id')
      .single()

    if (!claimed) continue

    const { data: rsvps } = await sb
      .from('rsvps')
      .select('id, user_phone')
      .eq('event_id', evento.id)
      .is('checked_in_at', null)

    for (const rsvp of rsvps ?? []) {
      const link = `https://vaikeuvou.app/checkin/${rsvp.id}`
      await enviarWhatsapp(rsvp.user_phone, `E aí, foi no "${evento.title}"? Confirma sua presença: ${link}`)
      totalEnviados++
    }
  }

  return NextResponse.json({ ok: true, eventos: eventos?.length ?? 0, lembretes_enviados: totalEnviados })
}
