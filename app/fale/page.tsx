import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'

export default async function FalePage() {
  const session = await getSession()
  return (
    <InfoPageShell
      title="Fale conosco"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
    />
  )
}
