import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import CriarClient from './CriarClient'

export default async function CriarPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <CriarClient
      userName={session.users.name}
      userAvatar={session.users.avatar_url}
    />
  )
}
