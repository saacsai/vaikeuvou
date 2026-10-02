import { redirect } from 'next/navigation'
import { getSession, canAccessPautas } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import InfoPageShell from '@/components/InfoPageShell'
import PerfilClient from './PerfilClient'

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/perfil')

  const { data: user } = await getSupabaseAdmin()
    .from('users')
    .select('id, phone, name, avatar_url, bio, vibe, instagram, pode_criar_post')
    .eq('id', session.user_id)
    .single()

  if (!user) redirect('/login?next=/perfil')

  return (
    <InfoPageShell title="Meu perfil" userName={user.name} userAvatar={user.avatar_url} podeCriarPost={canAccessPautas(user)}>
      <PerfilClient
        userId={user.id}
        phone={user.phone}
        name={user.name}
        avatarUrl={user.avatar_url}
        bio={user.bio}
        vibe={user.vibe}
        instagram={user.instagram}
      />
    </InfoPageShell>
  )
}
