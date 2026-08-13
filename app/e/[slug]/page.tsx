import { getSupabase } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import EventoClient from './EventoClient'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ref?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug }  = await params
  const { ref }   = await searchParams
  const sb        = getSupabase()
  const { data }  = await sb.from('events').select('title, event_date, location, bg_image_url').eq('slug', slug).single()
  if (!data) return { title: 'vaikeuvou.app' }

  const base     = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vaikeuvou.app'
  const dateStr  = new Date(data.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const ogUrl    = `${base}/api/og?title=${encodeURIComponent(data.title)}&date=${encodeURIComponent(dateStr)}${data.location ? `&location=${encodeURIComponent(data.location)}` : ''}`

  return {
    title: `${data.title} — vaikeuvou.app`,
    description: `${data.location ?? ''} · ${dateStr}. Clique em BORA para confirmar presença!`,
    openGraph: {
      title: data.title,
      description: `Clique em BORA para confirmar presença!`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: data.title, images: [ogUrl] },
  }
}

export default async function EventoPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { ref }  = await searchParams
  const sb       = getSupabase()

  const { data: evento } = await sb
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!evento) notFound()

  const { data: rsvps } = await sb
    .from('rsvps')
    .select('id, user_name, depth_level, created_at')
    .eq('event_id', evento.id)
    .order('created_at', { ascending: true })

  return (
    <EventoClient
      evento={evento}
      rsvps={rsvps ?? []}
      parentRsvpId={ref ?? null}
    />
  )
}
