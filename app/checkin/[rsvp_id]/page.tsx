import { getSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import CheckinClient from './CheckinClient'

type Props = { params: Promise<{ rsvp_id: string }> }

export default async function CheckinPage({ params }: Props) {
  const { rsvp_id } = await params
  const sb = getSupabase()

  const { data: rsvp } = await sb
    .from('rsvps')
    .select('id, user_name, event_id, checked_in_at, checkin_verified')
    .eq('id', rsvp_id)
    .single()

  if (!rsvp) notFound()

  const { data: evento } = await sb
    .from('events')
    .select('title, event_date')
    .eq('id', rsvp.event_id)
    .single()

  if (!evento) notFound()

  return (
    <CheckinClient
      rsvpId={rsvp.id}
      userName={rsvp.user_name}
      eventoTitulo={evento.title}
      jaConfirmado={!!rsvp.checked_in_at}
    />
  )
}
