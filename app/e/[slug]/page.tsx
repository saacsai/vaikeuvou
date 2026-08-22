import { getSupabase, getSupabaseAdmin } from '@/lib/supabase'
import { titleToHeader } from '@/lib/headers'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import EventoClient from './EventoClient'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ref?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const sb       = getSupabase()
  const { data } = await sb.from('events').select('title, event_date, location, bg_image_url').eq('slug', slug).single()
  if (!data) return { title: 'vaikeuvou.app' }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vaikeuvou.app'

  // Formato curto pro preview do WhatsApp — o espaço ali é bem limitado
  // (~2 linhas antes de truncar), então "quarta-feira, 28 de agosto..."
  // não cabe. "Dia 28/08 às 22:00" é o suficiente.
  const diaHoraParts = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  }).formatToParts(new Date(data.event_date))
  const getPart = (t: string) => diaHoraParts.find(p => p.type === t)?.value ?? ''
  const previewDescricao = `Dia ${getPart('day')}/${getPart('month')} às ${getPart('hour')}:${getPart('minute')}, clique para saber mais detalhes.`

  // O preview do WhatsApp mostra a foto de cabeçalho de verdade do convite
  // (a mesma que a pessoa escolheu ou subiu) — nada de gerar um cartão à
  // parte com texto por cima, que só duplicava título/data/local (isso já
  // vai no og:title/og:description abaixo, como texto de verdade).
  const headerSrc = data.bg_image_url || titleToHeader(data.title).src
  const imageUrl  = headerSrc.startsWith('http') ? headerSrc : `${base}${headerSrc}`

  return {
    title: `${data.title} — vaikeuvou.app`,
    description: previewDescricao,
    openGraph: {
      title: data.title,
      description: previewDescricao,
      images: [{ url: imageUrl }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: data.title, images: [imageUrl] },
  }
}

export default async function EventoPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { ref }  = await searchParams
  const sb       = getSupabase()
  const sbAdmin  = getSupabaseAdmin()
  const session  = await getSession()

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

  // Buscar avatar do criador (se evento vinculado a um user)
  let criador = null
  if (evento.user_id) {
    const { data: user } = await sbAdmin
      .from('users')
      .select('name, avatar_url, bio, instagram')
      .eq('id', evento.user_id)
      .single()
    criador = user
  }

  return (
    <EventoClient
      evento={evento}
      rsvps={rsvps ?? []}
      parentRsvpId={ref ?? null}
      criador={criador}
      sessionUser={session ? { name: session.users.name ?? '', phone: session.users.phone } : null}
    />
  )
}
