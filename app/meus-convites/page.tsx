import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSession, canAccessPautas } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'
import { ProfilePopover } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'

const PAGE_SIZE = 15

type Evento = { id: string; title: string; slug: string; event_date: string; edit_token: string | null; location: string | null }

type Props = {
  searchParams: Promise<{
    futuro?: string; passado?: string
    confirmFuturo?: string; confirmPassado?: string
    mp_conectado?: string; mp_erro?: string
  }>
}

export default async function MeusEventosPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect('/login?next=/meus-convites')

  const {
    futuro: futuroParam, passado: passadoParam,
    confirmFuturo: confirmFuturoParam, confirmPassado: confirmPassadoParam,
    mp_conectado, mp_erro,
  } = await searchParams
  const pageFuturo  = Math.max(1, parseInt(futuroParam ?? '1', 10) || 1)
  const pagePassado = Math.max(1, parseInt(passadoParam ?? '1', 10) || 1)
  const pageConfirmFuturo  = Math.max(1, parseInt(confirmFuturoParam ?? '1', 10) || 1)
  const pageConfirmPassado = Math.max(1, parseInt(confirmPassadoParam ?? '1', 10) || 1)

  const agora = new Date().toISOString()
  const sb = getSupabaseAdmin()

  // IDs dos eventos em que a pessoa confirmou presença (RSVP) — casando pelo
  // telefone da sessão, igual ao resto do app faz pra identidade. Exclui os
  // que ela mesma organiza (já aparecem na seção de cima, não precisa
  // duplicar). Volume por pessoa é pequeno, não precisa paginar essa busca.
  const { data: minhasRsvps } = await sb
    .from('rsvps')
    .select('event_id')
    .eq('user_phone', session.users.phone)
  const idsConfirmados = Array.from(new Set((minhasRsvps ?? []).map(r => r.event_id)))

  const [futurosRes, passadosRes, confirmFuturosRes, confirmPassadosRes] = await Promise.all([
    sb.from('events')
      .select('id, title, slug, event_date, edit_token, location', { count: 'exact' })
      .eq('user_id', session.user_id)
      .gte('event_date', agora)
      .order('event_date', { ascending: true })
      .range((pageFuturo - 1) * PAGE_SIZE, pageFuturo * PAGE_SIZE - 1),
    sb.from('events')
      .select('id, title, slug, event_date, edit_token, location', { count: 'exact' })
      .eq('user_id', session.user_id)
      .lt('event_date', agora)
      .order('event_date', { ascending: false })
      .range((pagePassado - 1) * PAGE_SIZE, pagePassado * PAGE_SIZE - 1),
    idsConfirmados.length === 0 ? { data: [], count: 0 } : sb.from('events')
      .select('id, title, slug, event_date, location', { count: 'exact' })
      .in('id', idsConfirmados)
      .neq('user_id', session.user_id)
      .gte('event_date', agora)
      .order('event_date', { ascending: true })
      .range((pageConfirmFuturo - 1) * PAGE_SIZE, pageConfirmFuturo * PAGE_SIZE - 1),
    idsConfirmados.length === 0 ? { data: [], count: 0 } : sb.from('events')
      .select('id, title, slug, event_date, location', { count: 'exact' })
      .in('id', idsConfirmados)
      .neq('user_id', session.user_id)
      .lt('event_date', agora)
      .order('event_date', { ascending: false })
      .range((pageConfirmPassado - 1) * PAGE_SIZE, pageConfirmPassado * PAGE_SIZE - 1),
  ])

  const futuros  = (futurosRes.data ?? []) as Evento[]
  const passados = (passadosRes.data ?? []) as Evento[]
  const confirmFuturos  = (confirmFuturosRes.data ?? []) as Evento[]
  const confirmPassados = (confirmPassadosRes.data ?? []) as Evento[]
  const totalFuturos  = futurosRes.count ?? 0
  const totalPassados = passadosRes.count ?? 0
  const totalConfirmFuturos  = confirmFuturosRes.count ?? 0
  const totalConfirmPassados = confirmPassadosRes.count ?? 0
  const totalPagesFuturo  = Math.max(1, Math.ceil(totalFuturos / PAGE_SIZE))
  const totalPagesPassado = Math.max(1, Math.ceil(totalPassados / PAGE_SIZE))
  const totalPagesConfirmFuturo  = Math.max(1, Math.ceil(totalConfirmFuturos / PAGE_SIZE))
  const totalPagesConfirmPassado = Math.max(1, Math.ceil(totalConfirmPassados / PAGE_SIZE))

  if (pageFuturo > totalPagesFuturo && totalFuturos > 0) redirect(`/meus-convites?futuro=${totalPagesFuturo}`)
  if (pagePassado > totalPagesPassado && totalPassados > 0) redirect(`/meus-convites?passado=${totalPagesPassado}`)
  if (pageConfirmFuturo > totalPagesConfirmFuturo && totalConfirmFuturos > 0) redirect(`/meus-convites?confirmFuturo=${totalPagesConfirmFuturo}`)
  if (pageConfirmPassado > totalPagesConfirmPassado && totalConfirmPassados > 0) redirect(`/meus-convites?confirmPassado=${totalPagesConfirmPassado}`)

  const user = session.users
  const podeCriarPost = canAccessPautas(user)
  const semConvites = totalFuturos === 0 && totalPassados === 0 && totalConfirmFuturos === 0 && totalConfirmPassados === 0

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1">
            <div className="flex items-center justify-between md:contents">
              <a href="https://vaikeuvou.app" className="flex-shrink-0">
                <Image src="/logo.png" alt="vaikeuvou" width={1230} height={315} className="h-[43px] md:h-[47px] w-auto -mt-[25px]" />
              </a>
              <div className="flex items-center gap-1 md:hidden">
                <ProfilePopover userName={user.name} userAvatar={user.avatar_url} podeCriarPost={podeCriarPost} />
              </div>
            </div>

            <div className="flex items-center gap-x-2 flex-wrap md:flex-1">
              <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
              <span className="text-brand font-bold text-[25px] whitespace-nowrap">Meus eventos</span>
            </div>

            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              <ProfilePopover userName={user.name} userAvatar={user.avatar_url} podeCriarPost={podeCriarPost} />
            </div>
          </div>

          {/* Criar novo */}
          <a
            href="/criar"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-base uppercase tracking-wide transition-colors"
          >
            + Criar novo evento
          </a>

          {semConvites ? (
            <div className="max-w-md mx-auto bg-white border border-gray-100 rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-gray-500 text-sm">Nenhum evento ainda.</p>
              <p className="text-gray-400 text-xs mt-1">Crie seu primeiro evento acima!</p>
            </div>
          ) : (
            <>
              {totalFuturos > 0 && (
                <EventoSection
                  titulo="Vai acontecer"
                  eventos={futuros}
                  page={pageFuturo}
                  totalPages={totalPagesFuturo}
                  paramName="futuro"
                  encerrado={false}
                />
              )}

              {totalPassados > 0 && (
                <EventoSection
                  titulo="Já aconteceu"
                  eventos={passados}
                  page={pagePassado}
                  totalPages={totalPagesPassado}
                  paramName="passado"
                  encerrado
                />
              )}

              {totalConfirmFuturos > 0 && (
                <EventoSection
                  titulo="Você confirmou presença"
                  eventos={confirmFuturos}
                  page={pageConfirmFuturo}
                  totalPages={totalPagesConfirmFuturo}
                  paramName="confirmFuturo"
                  encerrado={false}
                />
              )}

              {totalConfirmPassados > 0 && (
                <EventoSection
                  titulo="Você confirmou presença (já aconteceu)"
                  eventos={confirmPassados}
                  page={pageConfirmPassado}
                  totalPages={totalPagesConfirmPassado}
                  paramName="confirmPassado"
                  encerrado
                />
              )}
            </>
          )}

        </div>
      </div>

      <AppFooter />
    </div>
  )
}

function EventoSection({
  titulo, eventos, page, totalPages, paramName, encerrado,
}: {
  titulo: string
  eventos: Evento[]
  page: number
  totalPages: number
  paramName: 'futuro' | 'passado' | 'confirmFuturo' | 'confirmPassado'
  encerrado: boolean
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{titulo}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventos.map(e => (
          <div key={e.id} className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm ${encerrado ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-gray-900 truncate">{e.title}</p>
                  {encerrado && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 text-[9px] font-bold uppercase tracking-wide">Encerrado</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{fmtDate(e.event_date)}</p>
                {e.location && <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {e.location}</p>}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {e.edit_token && (
                  <a
                    href={`/dashboard/${e.edit_token}`}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wide text-center"
                  >
                    Painel
                  </a>
                )}
                <a
                  href={`/e/${e.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center"
                  target="_blank"
                >
                  Ver evento
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-1">
          {page > 1 ? (
            <a href={`/meus-convites?${paramName}=${page - 1}`} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold uppercase tracking-wide text-gray-700">
              ‹ Anterior
            </a>
          ) : (
            <span className="px-4 py-2 rounded-lg bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-300 cursor-not-allowed">‹ Anterior</span>
          )}
          <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages ? (
            <a href={`/meus-convites?${paramName}=${page + 1}`} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Próxima ›
            </a>
          ) : (
            <span className="px-4 py-2 rounded-lg bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-300 cursor-not-allowed">Próxima ›</span>
          )}
        </div>
      )}
    </div>
  )
}
