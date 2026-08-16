import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'

export default async function HistoriaPage() {
  const session = await getSession()
  return (
    <InfoPageShell
      title="18 anos depois"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
    />
  )
}
