import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizePhone } from '@/lib/auth'
import { enviarWhatsapp } from '@/lib/evolution'
import { fmtDataConfirmacao, linksCalendarioTxt } from '@/lib/calendar'

export async function POST(req: NextRequest) {
  const { event_id, user_name, user_phone, parent_rsvp_id } = await req.json()

  if (!event_id || !user_name || !user_phone) {
    return NextResponse.json({ error: 'event_id, nome e telefone são obrigatórios' }, { status: 400 })
  }

  const phone = normalizePhone(user_phone)
  if (phone.length < 12 || phone.length > 13) {
    return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  // Valida se evento existe e pega max_depth
  const { data: evento } = await sb
    .from('events')
    .select('id, max_depth, title, slug, event_date, event_date_fim, duration_minutes, location, description')
    .eq('id', event_id)
    .single()

  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

  // Verifica profundidade do pai (se vier ref)
  if (parent_rsvp_id) {
    const { data: pai } = await sb
      .from('rsvps')
      .select('depth_level')
      .eq('id', parent_rsvp_id)
      .single()

    if (pai && pai.depth_level >= evento.max_depth) {
      return NextResponse.json({ error: 'Limite de convites atingido para este evento' }, { status: 403 })
    }
  }

  // Anti-abuso básico: mesmo telefone só confirma uma vez por evento
  const { data: jaConfirmou } = await sb
    .from('rsvps')
    .select('id')
    .eq('event_id', event_id)
    .eq('user_phone', phone)
    .single()

  if (jaConfirmou) {
    return NextResponse.json({ ok: true, rsvp_id: jaConfirmou.id, ja_confirmado: true })
  }

  // Função no banco trava a linha do evento e checa vagas_maximas antes de
  // inserir, numa única transação — evita furar o limite quando duas
  // pessoas confirmam a última vaga ao mesmo tempo.
  const { data: rsvp, error } = await sb
    .rpc('vkv_confirmar_rsvp', {
      p_event_id: event_id,
      p_user_name: user_name.trim(),
      p_user_phone: phone,
      p_parent_rsvp_id: parent_rsvp_id || null,
    })
    .select('id, depth_level')
    .single()

  if (error) {
    if (error.message?.includes('evento_lotado')) {
      return NextResponse.json({ error: 'Esse evento já atingiu o número máximo de vagas.' }, { status: 409 })
    }
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Você já confirmou presença nesse evento.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message ?? 'Erro ao confirmar presença' }, { status: 500 })
  }
  if (!rsvp) {
    return NextResponse.json({ error: 'Erro ao confirmar presença' }, { status: 500 })
  }

  const texto = `🎉 BORA confirmado!\n\nSua presença está confirmada em *${evento.title}*, dia ${fmtDataConfirmacao(evento.event_date)}${evento.location ? ` no local ${evento.location}` : ''}.\n\n${linksCalendarioTxt(evento)}\n\nNos vemos lá!`
  const envio = await enviarWhatsapp(phone, texto)
  if (!envio.ok) {
    console.error('Falha ao enviar confirmação de RSVP por WhatsApp:', envio.error)
  }

  return NextResponse.json({ ok: true, rsvp_id: rsvp.id, depth_level: rsvp.depth_level })
}
