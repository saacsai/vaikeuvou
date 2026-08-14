import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'
import LogoutButton from './LogoutButton'

export default async function MeusEventosPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const sb = getSupabaseAdmin()
  const { data: eventos } = await sb
    .from('events')
    .select('id, title, slug, event_date, edit_token, location')
    .eq('user_id', session.user_id)
    .order('created_at', { ascending: false })

  const user = session.users

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-1">vaikeuvou.app</p>
            <h1 className="text-2xl font-extrabold">Meus eventos</h1>
            <p className="text-gray-500 text-xs mt-0.5">{user.phone}</p>
          </div>
          <LogoutButton />
        </div>

        {/* Criar novo */}
        <a
          href="/criar"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-base transition-colors"
        >
          + Criar novo evento
        </a>

        {/* Lista */}
        {eventos && eventos.length > 0 ? (
          <div className="space-y-3">
            {eventos.map(e => (
              <div key={e.id} className="bg-gray-900 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{e.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{fmtDate(e.event_date)}</p>
                    {e.location && <p className="text-gray-500 text-xs mt-0.5 truncate">📍 {e.location}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <a
                      href={`/dashboard/${e.edit_token}`}
                      className="px-3 py-1.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-xs font-semibold text-white text-center"
                    >
                      Painel
                    </a>
                    <a
                      href={`/e/${e.slug}`}
                      className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 text-center"
                      target="_blank"
                    >
                      Ver evento
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-gray-400 text-sm">Nenhum evento ainda.</p>
            <p className="text-gray-500 text-xs mt-1">Crie seu primeiro evento acima!</p>
          </div>
        )}

      </div>
    </div>
  )
}
