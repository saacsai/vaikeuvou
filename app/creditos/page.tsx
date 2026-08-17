import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import InfoPageShell from '@/components/InfoPageShell'
import CreditosClient from './CreditosClient'

type Props = { searchParams: Promise<{ success?: string; canceled?: string }> }

export default async function CreditosPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect('/login?next=/creditos')

  const { success, canceled } = await searchParams

  const { data: user } = await getSupabaseAdmin()
    .from('users')
    .select('credits')
    .eq('id', session.user_id)
    .single()

  return (
    <InfoPageShell title="Meus créditos" userName={session.users.name} userAvatar={session.users.avatar_url}>
      <CreditosClient
        credits={user?.credits ?? 0}
        success={success === '1'}
        canceled={canceled === '1'}
      />
    </InfoPageShell>
  )
}
