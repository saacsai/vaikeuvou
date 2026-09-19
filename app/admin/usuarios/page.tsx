import { getSupabaseAdmin } from '@/lib/supabase'
import SearchBox from '@/components/admin/SearchBox'
import UsuarioRow from './UsuarioRow'

const PAGE_SIZE = 20

type Usuario = {
  id: string
  name: string | null
  phone: string
  avatar_url: string | null
  bio: string | null
  instagram: string | null
  created_at: string
}

type Props = { searchParams: Promise<{ q?: string; page?: string }> }

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const sb = getSupabaseAdmin()

  let query = sb
    .from('users')
    .select('id, name, phone, avatar_url, bio, instagram, created_at', { count: 'exact' })

  if (q?.trim()) {
    const termo = q.trim()
    query = query.or(`name.ilike.%${termo}%,phone.ilike.%${termo}%`)
  }

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const usuarios = (data ?? []) as Usuario[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const qParam = q?.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchBox basePath="/admin/usuarios" placeholder="Buscar por nome ou telefone…" />
        <span className="text-xs text-gray-400">{total} usuário{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <UsuarioRow key={u.id} usuario={u} />
            ))}
            {usuarios.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-1">
          {page > 1 ? (
            <a href={`/admin/usuarios?page=${page - 1}${qParam}`} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold uppercase tracking-wide text-gray-700">‹ Anterior</a>
          ) : (
            <span className="px-4 py-2 rounded-lg bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-300">‹ Anterior</span>
          )}
          <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages ? (
            <a href={`/admin/usuarios?page=${page + 1}${qParam}`} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold uppercase tracking-wide text-gray-700">Próxima ›</a>
          ) : (
            <span className="px-4 py-2 rounded-lg bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-300">Próxima ›</span>
          )}
        </div>
      )}
    </div>
  )
}
