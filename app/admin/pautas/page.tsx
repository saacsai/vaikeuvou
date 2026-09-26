import { redirect } from 'next/navigation'
import { getSession, isAdminPhone, canAccessPautas } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { BlogBrief } from '@/lib/supabase'
import PautaForm from './PautaForm'

const TAG_LABEL: Record<string, string> = {
  VaikeuFui:   '#VaikeuFui',
  Tendeu:      '#Tendeu',
  ProntoFalei: '#ProntoFalei',
  VamoAi:      '#VamoAí?',
  Revisar:     'Revisar',
}

export default async function AdminPautasPage() {
  const session = await getSession()
  if (!session || !canAccessPautas(session.users.phone)) redirect('/')

  const isAdmin = isAdminPhone(session.users.phone)
  const sb = getSupabaseAdmin()

  let query = sb
    .from('blog_briefs')
    .select('id, tipo, titulo, ideias_centrais, status, event_id, criado_por, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // Editor só vê as próprias — inclui só o que ele mesmo mandou pelo
  // formulário; entradas automáticas do #VamoAí? (criado_por nulo, vêm de
  // evento de qualquer usuário do app) e pautas de outras pessoas ficam de
  // fora. Só o admin enxerga a fila inteira.
  if (!isAdmin) query = query.eq('criado_por', session.users.phone)

  const { data } = await query

  const pautas = (data ?? []) as BlogBrief[]
  const pendentes = pautas.filter(p => p.status === 'pendente')
  const geradas    = pautas.filter(p => p.status === 'gerado')

  // Nome de quem criou cada pauta, pra exibir em vez do telefone cru.
  const nomeByPhone = new Map<string, string>()
  if (isAdmin) {
    const telefones = [...new Set(pautas.map(p => p.criado_por).filter((p): p is string => !!p))]
    if (telefones.length > 0) {
      const { data: usersData } = await sb.from('users').select('phone, name').in('phone', telefones)
      for (const u of usersData ?? []) {
        if (u.name) nomeByPhone.set(u.phone, u.name)
      }
    }
  }

  return (
    <div className="space-y-6">
      <PautaForm />

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
          Pendentes ({pendentes.length})
        </p>
        <PautasTable pautas={pendentes} vazio="Nenhuma pauta pendente — a fila está limpa." isAdmin={isAdmin} nomeByPhone={nomeByPhone} />
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
          Já geradas ({geradas.length})
        </p>
        <PautasTable pautas={geradas} vazio="Nenhuma pauta processada ainda." isAdmin={isAdmin} nomeByPhone={nomeByPhone} />
      </div>
    </div>
  )
}

function PautasTable({ pautas, vazio, isAdmin, nomeByPhone }: {
  pautas: BlogBrief[]
  vazio: string
  isAdmin: boolean
  nomeByPhone: Map<string, string>
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Ideias centrais</th>
            <th className="px-4 py-3">Origem</th>
            {isAdmin && <th className="px-4 py-3">Criado por</th>}
            <th className="px-4 py-3">Criada em</th>
          </tr>
        </thead>
        <tbody>
          {pautas.map(p => (
            <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 align-top">
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {TAG_LABEL[p.tipo] ?? p.tipo}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900 max-w-[200px]">{p.titulo}</td>
              <td className="px-4 py-3 text-gray-500 text-xs max-w-[360px]">
                <p className="line-clamp-3">{p.ideias_centrais}</p>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">
                {p.event_id ? 'Evento (automático)' : 'Manual'}
              </td>
              {isAdmin && (
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {p.criado_por ? (nomeByPhone.get(p.criado_por) ?? p.criado_por) : '—'}
                </td>
              )}
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
          {pautas.length === 0 && (
            <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-gray-400">{vazio}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
