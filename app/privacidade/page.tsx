import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'

export default async function PrivacidadePage() {
  const session = await getSession()
  return (
    <InfoPageShell
      title="Política de Privacidade"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
    />
  )
}
