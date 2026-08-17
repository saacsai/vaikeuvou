import { getSupabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardClient from './DashboardClient'

type Props = { params: Promise<{ edit_token: string }>; searchParams: Promise<{ novo?: string }> }

export default async function DashboardPage({ params, searchParams }: Props) {
  const { edit_token } = await params
  const { novo }       = await searchParams
  const sb             = getSupabaseAdmin()
  const session        = await getSession()

  const { data: evento } = await sb
    .from('events')
    .select('*')
    .eq('edit_token', edit_token)
    .single()

  if (!evento) notFound()

  const { data: rsvps } = await sb
    .from('rsvps')
    .select('*')
    .eq('event_id', evento.id)
    .order('created_at', { ascending: true })

  return (
    <DashboardClient
      evento={evento}
      rsvps={rsvps ?? []}
      isNovo={novo === '1'}
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
      userBio={session?.users.bio ?? null}
      userInstagram={session?.users.instagram ?? null}
      userCredits={session?.users.credits ?? 0}
      isOwner={!!session && session.user_id === evento.user_id}
    />
  )
}
