import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'

export default async function TermosPage() {
  const session = await getSession()
  return (
    <InfoPageShell
      title="Termos de uso"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
    />
  )
}
