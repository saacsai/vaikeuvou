'use client'

import Image from 'next/image'
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

const PAGINAS = [
  { href: '/', label: 'Início' },
  { href: '/meus-eventos', label: 'Meus eventos' },
  { href: '/criar', label: 'Criar convite' },
]

export function MenuPopover() {
  return (
    <HeaderPopover label="Menu" trigger={<GridIcon />}>
      <nav className="space-y-1 pt-1">
        {PAGINAS.map(p => (
          <a
            key={p.href}
            href={p.href}
            className="block px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            {p.label}
          </a>
        ))}
      </nav>
    </HeaderPopover>
  )
}

type ProfileProps = {
  userName: string | null
  userAvatar: string | null
}

export function ProfilePopover({ userName, userAvatar }: ProfileProps) {
  const nome = userName ?? 'Você'
  const iniciais = nome.slice(0, 2).toUpperCase()

  const trigger = userAvatar ? (
    <Image src={userAvatar} alt={nome} width={32} height={32} className="w-8 h-8 md:w-[35px] md:h-[35px] rounded-full object-cover" unoptimized />
  ) : (
    <span className="w-8 h-8 md:w-[35px] md:h-[35px] rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
      {iniciais}
    </span>
  )

  return (
    <HeaderPopover label="Perfil" trigger={trigger}>
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
          className="block text-center mt-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700"
        >
          Editar perfil
        </a>
      </div>
    </HeaderPopover>
  )
}
