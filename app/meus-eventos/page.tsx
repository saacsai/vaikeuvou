import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'
import { MenuPopover, ProfilePopover } from '@/components/AppHeaderNav'

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
    <div className="min-h-screen bg-white text-gray-900 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1">
          <div className="flex items-center justify-between md:contents">
            <a href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-[43px] md:h-[47px] w-auto" />
            </a>
            <div className="flex items-center gap-1 md:hidden">
              <MenuPopover />
              <ProfilePopover userName={user.name} userAvatar={user.avatar_url} />
            </div>
          </div>

          <div className="flex items-center gap-x-2 flex-wrap md:flex-1">
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <span className="text-brand font-bold text-[25px] whitespace-nowrap">Meus eventos</span>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <MenuPopover />
            <ProfilePopover userName={user.name} userAvatar={user.avatar_url} />
          </div>
        </div>

        {/* Criar novo */}
        <a
          href="/criar"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-base transition-colors"
        >
          + Criar novo evento
        </a>

        {/* Lista */}
        {eventos && eventos.length > 0 ? (
          <div className="space-y-3">
            {eventos.map(e => (
              <div key={e.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{e.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{fmtDate(e.event_date)}</p>
                    {e.location && <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {e.location}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <a
                      href={`/dashboard/${e.edit_token}`}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 text-center"
                    >
                      Painel
                    </a>
                    <a
                      href={`/e/${e.slug}`}
                      className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-500 text-center"
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
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-gray-500 text-sm">Nenhum evento ainda.</p>
            <p className="text-gray-400 text-xs mt-1">Crie seu primeiro evento acima!</p>
          </div>
        )}

      </div>
    </div>
  )
}
