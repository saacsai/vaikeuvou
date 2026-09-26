import { redirect } from 'next/navigation'
import { getSession, isAdminPhone, canAccessPautas } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { ProfilePopover } from '@/components/AppHeaderNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || !canAccessPautas(session.users.phone)) redirect('/')

  const isAdmin = isAdminPhone(session.users.phone)

  // Usuários/Eventos e as estatísticas gerais são só do admin — editor
  // liberado só pra Pautas (canAccessPautas) não vê nada disso, nem precisa
  // que essas queries rodem.
  const stats = isAdmin ? await (async () => {
    const sb = getSupabaseAdmin()
    const [{ count: totalUsuarios }, { count: totalEventos }, { data: rsvpsData, count: totalRsvps }] = await Promise.all([
      sb.from('users').select('id', { count: 'exact', head: true }),
      sb.from('events').select('id', { count: 'exact', head: true }),
      sb.from('rsvps').select('user_phone', { count: 'exact' }),
    ])
    const telefonesDistintos = new Set((rsvpsData ?? []).map(r => r.user_phone)).size
    return [
      { label: 'Usuários', valor: totalUsuarios ?? 0 },
      { label: 'Eventos', valor: totalEventos ?? 0 },
      { label: 'Confirmações', valor: totalRsvps ?? 0 },
      { label: 'Telefones distintos', valor: telefonesDistintos },
    ]
  })() : null

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <span className="text-brand font-bold text-[25px]">Admin</span>
          </div>
          <ProfilePopover
            userName={session.users.name}
            userAvatar={session.users.avatar_url}
            podeCriarPost={canAccessPautas(session.users.phone)}
          />
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-brand">{s.valor}</p>
                <p className="text-gray-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 border-b border-gray-100">
          {isAdmin && (
            <>
              <a href="/admin/usuarios" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-brand">Usuários</a>
              <a href="/admin/eventos" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-brand">Eventos</a>
            </>
          )}
          <a href="/admin/pautas" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-brand">Pautas</a>
        </div>

        {children}
      </div>
    </div>
  )
}
