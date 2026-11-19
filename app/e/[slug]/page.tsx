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

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://live.vaikeuvou.app'

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

  // Quem já confirmou e volta no mesmo link não devia ver o botão BORA de
  // novo (achado real: Sandro confirmou, voltou depois, viu BORA de novo e
  // achou que precisava confirmar outra vez) — detecta de cara pelo telefone
  // da sessão, sem precisar clicar em nada pra "descobrir" que já confirmou.
  let meuRsvpExistente: string | null = null
  if (session) {
    const { data: rsvpExistente } = await sb
      .from('rsvps')
      .select('id')
      .eq('event_id', evento.id)
      .eq('user_phone', session.users.phone)
      .maybeSingle()
    meuRsvpExistente = rsvpExistente?.id ?? null
  }

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

  // Personalização em cascata: se veio de um reenvio (?ref=rsvp_id), quem
  // recebeu deve ver a foto/mensagem de quem especificamente convidou —
  // nunca a do criador raiz, senão perde o sentido ("quem é esse?").
  let convidador = null
  if (ref) {
    const { data: rsvpRef } = await sb
      .from('rsvps')
      .select('user_name, foto_url, mensagem, user_phone')
      .eq('id', ref)
      .eq('event_id', evento.id)
      .single()
    convidador = rsvpRef

    // Quem reenvia pode já ter avatar no perfil e nunca ter passado pelo
    // upload específico do convite (achado real: Sandro trocou a mensagem,
    // pulou a foto, ficou com iniciais mesmo já tendo foto cadastrada) —
    // sem foto_url próprio, cai no avatar do perfil em vez de iniciais.
    if (convidador && !convidador.foto_url && convidador.user_phone) {
      const { data: user } = await sbAdmin
        .from('users')
        .select('avatar_url')
        .eq('phone', convidador.user_phone)
        .single()
      if (user?.avatar_url) convidador.foto_url = user.avatar_url
    }
    // user_phone só serviu pro lookup acima — nunca deve ir pro client
    // component (a página é pública, isso vazaria o telefone de quem convidou).
    if (convidador) delete (convidador as { user_phone?: string }).user_phone
  }

  return (
    <EventoClient
      evento={evento}
      rsvps={rsvps ?? []}
      parentRsvpId={ref ?? null}
      criador={criador}
      convidador={convidador}
      sessionUser={session ? { name: session.users.name ?? '', phone: session.users.phone, avatar_url: session.users.avatar_url } : null}
      meuRsvpExistente={meuRsvpExistente}
    />
  )
}
