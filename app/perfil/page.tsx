import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import PerfilClient from './PerfilClient'

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const { data: user } = await getSupabaseAdmin()
    .from('users')
    .select('id, phone, name, avatar_url')
    .eq('id', session.user_id)
    .single()

  if (!user) redirect('/login')

  return (
    <PerfilClient
      userId={user.id}
      phone={user.phone}
      name={user.name}
      avatarUrl={user.avatar_url}
    />
  )
}
