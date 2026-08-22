import { getSupabase } from '@/lib/supabase'
import { titleToHeader } from '@/lib/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import CheckinClient from './CheckinClient'

type Props = { params: Promise<{ rsvp_id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rsvp_id } = await params
  const sb = getSupabase()

  const { data: rsvp } = await sb.from('rsvps').select('event_id').eq('id', rsvp_id).single()
  if (!rsvp) return { title: 'vaikeuvou.app' }

  const { data: evento } = await sb.from('events').select('title, bg_image_url').eq('id', rsvp.event_id).single()
  if (!evento) return { title: 'vaikeuvou.app' }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vaikeuvou.app'
  // Mesma foto do convite original, pra bater com o que a pessoa já viu.
  const headerSrc = evento.bg_image_url || titleToHeader(evento.title).src
  const imageUrl  = headerSrc.startsWith('http') ? headerSrc : `${base}${headerSrc}`
  const description = `Confirme sua presença em "${evento.title}".`

  return {
    title: `Confirme sua presença — ${evento.title}`,
    description,
    openGraph: { title: evento.title, description, images: [{ url: imageUrl }], type: 'website' },
    twitter: { card: 'summary_large_image', title: evento.title, images: [imageUrl] },
  }
}

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
