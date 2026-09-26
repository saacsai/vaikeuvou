import { getSupabaseAdmin } from '@/lib/supabase'
import type { BlogBrief } from '@/lib/supabase'
import PautaForm from './PautaForm'

const TAG_LABEL: Record<string, string> = {
  VaikeuFui:   '#VaikeuFui',
  Tendeu:      '#Tendeu',
  ProntoFalei: '#ProntoFalei',
  VamoAi:      '#VamoAí?',
}

export default async function AdminPautasPage() {
  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('blog_briefs')
    .select('id, tipo, titulo, ideias_centrais, status, event_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const pautas = (data ?? []) as BlogBrief[]
  const pendentes = pautas.filter(p => p.status === 'pendente')
  const geradas    = pautas.filter(p => p.status === 'gerado')

  return (
    <div className="space-y-6">
      <PautaForm />

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
          Pendentes ({pendentes.length})
        </p>
        <PautasTable pautas={pendentes} vazio="Nenhuma pauta pendente — a fila está limpa." />
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
          Já geradas ({geradas.length})
        </p>
        <PautasTable pautas={geradas} vazio="Nenhuma pauta processada ainda." />
      </div>
    </div>
  )
}

function PautasTable({ pautas, vazio }: { pautas: BlogBrief[]; vazio: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Ideias centrais</th>
            <th className="px-4 py-3">Origem</th>
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
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
          {pautas.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{vazio}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
