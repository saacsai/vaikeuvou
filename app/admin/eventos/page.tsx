import { getSupabaseAdmin } from '@/lib/supabase'
import SearchBox from '@/components/admin/SearchBox'

const PAGE_SIZE = 20

type Evento = {
  id: string
  title: string
  event_date: string
  edit_token: string
  creator_phone: string
  user_id: string | null
  guest_list_unlocked_at: string | null
}

type Props = { searchParams: Promise<{ q?: string; page?: string }> }

export default async function AdminEventosPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const sb = getSupabaseAdmin()

  let query = sb
    .from('events')
    .select('id, title, event_date, edit_token, creator_phone, user_id, guest_list_unlocked_at', { count: 'exact' })

  if (q?.trim()) query = query.ilike('title', `%${q.trim()}%`)

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const eventos = (data ?? []) as Evento[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Nome do criador — join manual por user_id, fallback pro telefone.
  const criadorPorUserId = new Map<string, string>()
  const userIds = eventos.map(e => e.user_id).filter((id): id is string => !!id)
  if (userIds.length > 0) {
    const { data: criadores } = await sb.from('users').select('id, name').in('id', userIds)
    for (const c of criadores ?? []) if (c.name) criadorPorUserId.set(c.id, c.name)
  }

  // Contagem de confirmados/check-ins — uma query em lote, agregada em JS.
  const confirmadosPorEvento = new Map<string, number>()
  const checkinsPorEvento    = new Map<string, number>()
  const eventoIds = eventos.map(e => e.id)
  if (eventoIds.length > 0) {
    const { data: rsvps } = await sb.from('rsvps').select('event_id, checked_in_at').in('event_id', eventoIds)
    for (const r of rsvps ?? []) {
      confirmadosPorEvento.set(r.event_id, (confirmadosPorEvento.get(r.event_id) ?? 0) + 1)
      if (r.checked_in_at) checkinsPorEvento.set(r.event_id, (checkinsPorEvento.get(r.event_id) ?? 0) + 1)
    }
  }

  const qParam = q?.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchBox basePath="/admin/eventos" placeholder="Buscar por título…" />
        <span className="text-xs text-gray-400">{total} evento{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Criador</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Confirmados</th>
              <th className="px-4 py-3">Check-ins</th>
              <th className="px-4 py-3">Desbloqueado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {eventos.map(e => (
              <tr key={e.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-900 max-w-[220px] truncate">{e.title}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {e.user_id ? (criadorPorUserId.get(e.user_id) ?? e.creator_phone) : e.creator_phone}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(e.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 font-mono text-gray-700">{confirmadosPorEvento.get(e.id) ?? 0}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{checkinsPorEvento.get(e.id) ?? 0}</td>
                <td className="px-4 py-3">
                  {e.guest_list_unlocked_at ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">sim</span>
                  ) : (
                    <span className="text-xs text-gray-400">não</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <a href={`/dashboard/${e.edit_token}`} target="_blank" className="text-xs font-semibold text-brand hover:opacity-80">
                    Abrir painel
                  </a>
                </td>
              </tr>
            ))}
            {eventos.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhum evento encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-1">
          {page > 1 ? (
            <a href={`/admin/eventos?page=${page - 1}${qParam}`} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold uppercase tracking-wide text-gray-700">‹ Anterior</a>
          ) : (
            <span className="px-4 py-2 rounded-lg bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-300">‹ Anterior</span>
          )}
          <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages ? (
            <a href={`/admin/eventos?page=${page + 1}${qParam}`} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold uppercase tracking-wide text-gray-700">Próxima ›</a>
          ) : (
            <span className="px-4 py-2 rounded-lg bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-300">Próxima ›</span>
          )}
        </div>
      )}
    </div>
  )
}
