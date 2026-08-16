import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { ProfilePopover } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'
import type { Rsvp } from '@/lib/supabase'

type Props = { params: Promise<{ edit_token: string }> }

const NIVEL_COR = [
  'bg-blue-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-teal-500',
]

function fmtHora(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function TreeNode({ rsvp, byParent, depth }: { rsvp: Rsvp; byParent: Map<string, Rsvp[]>; depth: number }) {
  const filhos = byParent.get(rsvp.id) ?? []
  const cor = NIVEL_COR[(rsvp.depth_level - 1) % NIVEL_COR.length]

  return (
    <div>
      <div className="flex items-center gap-3 py-2">
        <div className={`w-9 h-9 rounded-full ${cor} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
          {rsvp.user_name[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{rsvp.user_name}</p>
          <p className="text-xs text-gray-400">{fmtHora(rsvp.created_at)}</p>
        </div>
      </div>

      {filhos.length > 0 && (
        <div className="ml-[18px] pl-5 border-l-2 border-gray-100 space-y-0.5">
          {filhos.map(f => <TreeNode key={f.id} rsvp={f} byParent={byParent} depth={depth + 1} />)}
        </div>
      )}
    </div>
  )
}

export default async function ConvidadosPage({ params }: Props) {
  const { edit_token } = await params
  const sb      = getSupabaseAdmin()
  const session = await getSession()

  const { data: evento } = await sb
    .from('events')
    .select('*')
    .eq('edit_token', edit_token)
    .single()

  if (!evento) notFound()

  const { data: rsvpsData } = await sb
    .from('rsvps')
    .select('*')
    .eq('event_id', evento.id)
    .order('created_at', { ascending: true })

  const rsvps = rsvpsData ?? []

  const byParent = new Map<string, Rsvp[]>()
  for (const r of rsvps) {
    const key = r.parent_rsvp_id ?? 'root'
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(r)
  }
  const raizes = byParent.get('root') ?? []

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header — padrão */}
        <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1 mb-8">
          <div className="flex items-center justify-between md:contents">
            <a href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-[43px] md:h-[47px] w-auto" />
            </a>
            <div className="flex items-center gap-1 md:hidden">
              <ProfilePopover userName={session?.users.name ?? null} userAvatar={session?.users.avatar_url ?? null} />
            </div>
          </div>

          <div className="flex items-center gap-x-2 flex-wrap md:flex-1 min-w-0">
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <a href="/meus-convites" className="text-gray-400 hover:text-gray-600 text-sm whitespace-nowrap">Meus convites</a>
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <a href={`/dashboard/${edit_token}`} className="text-gray-400 hover:text-gray-600 text-sm truncate max-w-[140px]">{evento.title}</a>
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <span className="text-brand font-bold text-[25px] whitespace-nowrap">Quem vai</span>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <ProfilePopover userName={session?.users.name ?? null} userAvatar={session?.users.avatar_url ?? null} />
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          {rsvps.length} {rsvps.length === 1 ? 'pessoa confirmou' : 'pessoas confirmaram'} — veja a cadeia de quem convidou quem.
        </p>

        {raizes.length > 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="space-y-1">
              {raizes.map(r => <TreeNode key={r.id} rsvp={r} byParent={byParent} depth={0} />)}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <p className="text-3xl mb-2">👀</p>
            <p className="text-gray-500 text-sm">Nenhuma confirmação ainda.</p>
          </div>
        )}

      </div>

      <AppFooter />
    </div>
  )
}
