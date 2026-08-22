import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Raio generoso — sinal de confiança, não controle de segurança. GPS urbano
// erra fácil algumas centenas de metros, melhor deixar passar um falso
// positivo do que marcar como "não verificado" quem foi de verdade.
const CHECKIN_RADIUS_METERS = 750

function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

type Props = { params: Promise<{ rsvp_id: string }> }

export async function POST(req: NextRequest, { params }: Props) {
  const { rsvp_id } = await params
  const { lat, lng } = await req.json().catch(() => ({ lat: undefined, lng: undefined }))

  const sb = getSupabaseAdmin()

  const { data: rsvp } = await sb
    .from('rsvps')
    .select('id, event_id, checked_in_at, checkin_verified')
    .eq('id', rsvp_id)
    .single()

  if (!rsvp) return NextResponse.json({ error: 'Confirmação não encontrada.' }, { status: 404 })

  // Idempotente — reabrir o link depois de já ter feito check-in não
  // sobrescreve o horário nem reavalia a geo.
  if (rsvp.checked_in_at) {
    return NextResponse.json({ ok: true, checked_in_at: rsvp.checked_in_at, checkin_verified: rsvp.checkin_verified })
  }

  const { data: evento } = await sb.from('events').select('lat, lng').eq('id', rsvp.event_id).single()

  let verified = false
  if (typeof lat === 'number' && typeof lng === 'number' && evento?.lat != null && evento?.lng != null) {
    verified = distanciaMetros(lat, lng, evento.lat, evento.lng) <= CHECKIN_RADIUS_METERS
  }

  const checked_in_at = new Date().toISOString()

  await sb
    .from('rsvps')
    .update({
      checked_in_at,
      checkin_lat: typeof lat === 'number' ? lat : null,
      checkin_lng: typeof lng === 'number' ? lng : null,
      checkin_verified: verified,
    })
    .eq('id', rsvp_id)

  return NextResponse.json({ ok: true, checked_in_at, checkin_verified: verified })
}
