'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import HeaderPopover from '@/components/HeaderPopover'

export function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5 md:w-[22px] md:h-[22px]'} viewBox="0 0 20 20" fill="currentColor">
      {[2, 9, 16].flatMap(cy =>
        [2, 9, 16].map(cx => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" />)
      )}
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 6 10 7 10-7" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2m0 10v2m0-14v2m0 2v2m0-2v2" />
    </svg>
  )
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

type ProfileProps = {
  userName: string | null
  userAvatar: string | null
  userCredits?: number
}

export function ProfilePopover({ userName, userAvatar, userCredits = 0 }: ProfileProps) {
  const router = useRouter()
  const nome = userName ?? 'Você'
  const iniciais = nome.slice(0, 2).toUpperCase()

  async function sair() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <HeaderPopover label="Perfil" trigger={<GridIcon />}>
      <div className="pt-1">
        <div className="flex flex-col items-center text-center gap-2 pb-4 border-b border-gray-100">
          {userAvatar ? (
            <Image src={userAvatar} alt={nome} width={64} height={64} className="w-16 h-16 rounded-full object-cover" unoptimized />
          ) : (
            <span className="w-16 h-16 rounded-full bg-brand text-white text-xl font-bold flex items-center justify-center">
              {iniciais}
            </span>
          )}
          <p className="font-semibold text-gray-900">{nome}</p>
        </div>

        {/* Navegação */}
        <div className="py-2 border-b border-gray-100">
          <a
            href="/meus-convites"
            className="flex items-center justify-between px-1 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-700"
          >
            Meus convites
            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
          </a>
          <a
            href="/criar"
            className="flex items-center justify-between px-1 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-700"
          >
            Criar convite
            <PlusIcon className="w-4 h-4 text-gray-400" />
          </a>
        </div>

        {/* Créditos */}
        <div className="py-3 border-b border-gray-100 space-y-2">
          <div className="bg-brand/5 border border-brand/10 rounded-lg px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <TicketIcon className="w-4 h-4 text-brand" />
                Créditos disponíveis
              </span>
              <span className="text-sm font-bold text-brand">{userCredits}</span>
            </div>
            <a
              href="/creditos"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white border border-gray-200 hover:border-brand text-xs font-semibold uppercase tracking-wide text-gray-700 transition-colors"
            >
              Comprar créditos
            </a>
          </div>
          <a href="/como-funciona" className="block text-center text-xs text-gray-400 hover:text-gray-600">
            Como funciona?
          </a>
        </div>

        <a
          href="/perfil"
          className="flex items-center justify-center gap-1.5 mt-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold uppercase tracking-wide text-gray-700"
        >
          Editar perfil
          <EditIcon className="w-4 h-4" />
        </a>

        {/* Suporte */}
        <a
          href="/fale"
          className="flex items-center justify-center gap-1.5 mt-2 py-2.5 rounded-lg hover:bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          Fale conosco
          <MessageIcon className="w-3.5 h-3.5" />
        </a>

        <button
          type="button"
          onClick={sair}
          className="block w-full text-center mt-3 pt-3 pb-2.5 border-t border-gray-100 rounded-lg hover:bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-400"
        >
          Sair
        </button>
      </div>
    </HeaderPopover>
  )
}
