import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'
import { ProfilePopover } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'

const PAGE_SIZE = 15

type Props = { searchParams: Promise<{ page?: string }> }

export default async function MeusEventosPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const sb = getSupabaseAdmin()
  const { data: eventos, count } = await sb
    .from('events')
    .select('id, title, slug, event_date, edit_token, location', { count: 'exact' })
    .eq('user_id', session.user_id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  if (page > totalPages) redirect(`/meus-convites?page=${totalPages}`)

  const user = session.users

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1">
            <div className="flex items-center justify-between md:contents">
              <a href="/" className="flex-shrink-0">
                <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-[43px] md:h-[47px] w-auto" />
              </a>
              <div className="flex items-center gap-1 md:hidden">
                <ProfilePopover userName={user.name} userAvatar={user.avatar_url} />
              </div>
            </div>

            <div className="flex items-center gap-x-2 flex-wrap md:flex-1">
              <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
              <span className="text-brand font-bold text-[25px] whitespace-nowrap">Meus convites</span>
            </div>

            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              <ProfilePopover userName={user.name} userAvatar={user.avatar_url} />
            </div>
          </div>

          {/* Criar novo */}
          <a
            href="/criar"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-base transition-colors"
          >
            + Criar novo convite
          </a>

          {/* Lista */}
          {eventos && eventos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          Ver convite
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  {page > 1 ? (
                    <a href={`/meus-convites?page=${page - 1}`} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700">
                      ‹ Anterior
                    </a>
                  ) : (
                    <span className="px-4 py-2 rounded-lg bg-gray-50 text-sm font-semibold text-gray-300 cursor-not-allowed">‹ Anterior</span>
                  )}
                  <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
                  {page < totalPages ? (
                    <a href={`/meus-convites?page=${page + 1}`} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700">
                      Próxima ›
                    </a>
                  ) : (
                    <span className="px-4 py-2 rounded-lg bg-gray-50 text-sm font-semibold text-gray-300 cursor-not-allowed">Próxima ›</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="max-w-md mx-auto bg-white border border-gray-100 rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-gray-500 text-sm">Nenhum convite ainda.</p>
              <p className="text-gray-400 text-xs mt-1">Crie seu primeiro convite acima!</p>
            </div>
          )}

        </div>
      </div>

      <AppFooter />
    </div>
  )
}
