import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { ProfilePopover } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'
import DesbloquearButton from './DesbloquearButton'
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

function TreeNode({ rsvp, byParent, avatarByPhone }: { rsvp: Rsvp; byParent: Map<string, Rsvp[]>; avatarByPhone: Map<string, string> }) {
  const filhos = byParent.get(rsvp.id) ?? []
  const cor = NIVEL_COR[(rsvp.depth_level - 1) % NIVEL_COR.length]
  const avatar = avatarByPhone.get(rsvp.user_phone)

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-1 w-[90px]">
        {avatar ? (
          <Image src={avatar} alt={rsvp.user_name} width={44} height={44} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className={`w-11 h-11 rounded-full ${cor} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
            {rsvp.user_name[0].toUpperCase()}
          </div>
        )}
        <p className="text-xs font-semibold text-gray-900 text-center leading-tight truncate w-full">{rsvp.user_name}</p>
        <p className="text-[10px] text-gray-400">{fmtHora(rsvp.created_at)}</p>
      </div>

      {filhos.length > 0 && (
        <>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex justify-center">
            {filhos.map((f, i) => (
              <div key={f.id} className="relative px-3 pt-5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-5 bg-gray-200" />
                <div
                  className="absolute top-0 h-px bg-gray-200"
                  style={{ left: i === 0 ? '50%' : 0, right: i === filhos.length - 1 ? '50%' : 0 }}
                />
                <TreeNode rsvp={f} byParent={byParent} avatarByPhone={avatarByPhone} />
              </div>
            ))}
          </div>
        </>
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

  const isOwner = !!session && session.user_id === evento.user_id

  const { data: rsvpsData } = await sb
    .from('rsvps')
    .select('*')
    .eq('event_id', evento.id)
    .order('created_at', { ascending: true })

  const rsvps = rsvpsData ?? []

  const avatarByPhone = new Map<string, string>()
  if (rsvps.length > 0) {
    const { data: usersData } = await sb
      .from('users')
      .select('phone, avatar_url')
      .in('phone', rsvps.map(r => r.user_phone))
    for (const u of usersData ?? []) {
      if (u.avatar_url) avatarByPhone.set(u.phone, u.avatar_url)
    }
  }

  const byParent = new Map<string, Rsvp[]>()
  for (const r of rsvps) {
    const key = r.parent_rsvp_id ?? 'root'
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(r)
  }
  const raizes = byParent.get('root') ?? []

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">

        {/* Header — padrão */}
        <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1 mb-8">
          <div className="flex items-center justify-between md:contents">
            <a href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="vaikeuvou" width={1161} height={201} className="h-[43px] md:h-[47px] w-auto" />
            </a>
            <div className="flex items-center gap-1 md:hidden">
              <ProfilePopover userName={session?.users.name ?? null} userAvatar={session?.users.avatar_url ?? null} userCredits={session?.users.credits ?? 0} />
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
            <ProfilePopover userName={session?.users.name ?? null} userAvatar={session?.users.avatar_url ?? null} userCredits={session?.users.credits ?? 0} />
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          {rsvps.length} {rsvps.length === 1 ? 'pessoa confirmou' : 'pessoas confirmaram'} — veja a cadeia de quem convidou quem.
        </p>

        {rsvps.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <p className="text-3xl mb-2">👀</p>
            <p className="text-gray-500 text-sm">Nenhuma confirmação ainda.</p>
          </div>
        ) : !evento.guest_list_unlocked_at ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <p className="text-3xl mb-2">🔒</p>
            <p className="text-gray-700 text-sm font-semibold mb-1">Conteúdo bloqueado</p>
            <p className="text-gray-400 text-xs mb-5">Desbloqueie por 3 créditos — vale pra sempre nesse convite.</p>
            {isOwner && <DesbloquearButton editToken={edit_token} />}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm overflow-x-auto">
            <div className="flex justify-center gap-6 min-w-fit mx-auto">
              {raizes.map(r => <TreeNode key={r.id} rsvp={r} byParent={byParent} avatarByPhone={avatarByPhone} />)}
            </div>
          </div>
        )}

      </div>

      <AppFooter />
    </div>
  )
}
