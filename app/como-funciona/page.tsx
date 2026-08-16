import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'

export default async function ComoFuncionaPage() {
  const session = await getSession()
  return (
    <InfoPageShell
      title="Como funciona?"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
    />
  )
}
