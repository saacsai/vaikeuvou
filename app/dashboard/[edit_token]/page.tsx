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

  // Comissão sempre lida da conta do organizador no momento de exibir (não
  // do valor travado no evento) — sempre a do dono do evento, não de quem
  // eventualmente estiver vendo o link do dashboard.
  const { data: organizador } = evento.user_id
    ? await sb.from('users').select('mp_access_token, comissao_percentual').eq('id', evento.user_id).single()
    : { data: null }

  return (
    <DashboardClient
      evento={evento}
      rsvps={rsvps ?? []}
      isNovo={novo === '1'}
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
      userBio={session?.users.bio ?? null}
      userInstagram={session?.users.instagram ?? null}
      userMpConectado={!!organizador?.mp_access_token}
      comissaoPercentual={organizador?.comissao_percentual ?? 15}
    />
  )
}
