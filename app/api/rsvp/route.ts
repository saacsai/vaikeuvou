import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fmtPhone } from '@/lib/slug'

export async function POST(req: NextRequest) {
  const { event_id, user_name, user_phone, parent_rsvp_id } = await req.json()

  if (!event_id || !user_name || !user_phone) {
    return NextResponse.json({ error: 'event_id, nome e telefone são obrigatórios' }, { status: 400 })
  }

  const phone = fmtPhone(user_phone)
  if (phone.length < 10) {
    return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  // Valida se evento existe e pega max_depth
  const { data: evento } = await sb
    .from('events')
    .select('id, max_depth, title')
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

  const { data: rsvp, error } = await sb
    .from('rsvps')
    .insert({
      event_id,
      user_name:      user_name.trim(),
      user_phone:     phone,
      parent_rsvp_id: parent_rsvp_id || null,
    })
    .select('id, depth_level')
    .single()

  if (error || !rsvp) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao confirmar presença' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, rsvp_id: rsvp.id, depth_level: rsvp.depth_level })
}
