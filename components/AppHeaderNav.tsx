'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import HeaderPopover from '@/components/HeaderPopover'

function GridIcon() {
  return (
    <svg className="w-5 h-5 md:w-[22px] md:h-[22px]" viewBox="0 0 20 20" fill="currentColor">
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

type ProfileProps = {
  userName: string | null
  userAvatar: string | null
}

export function ProfilePopover({ userName, userAvatar }: ProfileProps) {
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

        <div className="py-4 flex items-center justify-between border-b border-gray-100">
          <span className="text-sm text-gray-500">Créditos disponíveis</span>
          <span className="text-sm font-bold text-brand">Em breve</span>
        </div>

        <a
          href="/perfil"
          className="flex items-center justify-center gap-1.5 mt-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold uppercase tracking-wide text-gray-700"
        >
          Editar perfil
          <EditIcon className="w-4 h-4" />
        </a>

        <button
          type="button"
          onClick={sair}
          className="block w-full text-center mt-2 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-400"
        >
          Sair
        </button>
      </div>
    </HeaderPopover>
  )
}
