import Image from 'next/image'
import { getSession } from '@/lib/auth'
import SairButton from './SairButton'

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

// Feito pra rodar dentro de um <iframe> num widget do vaikeuvou.app (WordPress) —
// não tem header/rodapé próprio, só o painel. Todo link sai em nova aba
// (mesmo padrão já usado no botão "Criar evento" do header do WordPress), pra
// não prender quem clicou dentro do iframe pequeno da sidebar.
export default async function EmbedPerfilPage() {
  const session = await getSession()

  if (!session) {
    return (
      <div className="p-4 flex flex-col items-center text-center gap-4">
        <Image src="/logo-vertical.png" alt="vaikeuvou — Vamo aí?" width={1220} height={907} className="w-[150px] h-auto" />
        <p className="text-gray-400 text-[13px] leading-snug">
          Evento vazio. Sem chance.
          <br />
          Não saber quem vai. Piorou.
          <br />
          Eu vou. Bora?
        </p>
        <a
          href="https://live.vaikeuvou.app/criar"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm uppercase tracking-wide transition-colors"
        >
          Criar evento
        </a>
      </div>
    )
  }

  const nome = session.users.name ?? 'Você'
  const iniciais = nome.slice(0, 2).toUpperCase()
  const avatar = session.users.avatar_url

  return (
    <div className="p-3">
      <div className="flex flex-col items-center text-center gap-2 pb-4 border-b border-gray-100">
        {avatar ? (
          <Image src={avatar} alt={nome} width={64} height={64} className="w-16 h-16 rounded-full object-cover" unoptimized />
        ) : (
          <span className="w-16 h-16 rounded-full bg-brand text-white text-xl font-bold flex items-center justify-center">
            {iniciais}
          </span>
        )}
        <p className="font-semibold text-gray-900">{nome}</p>
      </div>

      <div className="py-2 border-b border-gray-100">
        <a
          href="https://live.vaikeuvou.app/meus-convites"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-1 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-700"
        >
          Meus convites
          <EnvelopeIcon className="w-4 h-4 text-gray-400" />
        </a>
        <a
          href="https://live.vaikeuvou.app/criar"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-1 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-700"
        >
          Criar convite
          <PlusIcon className="w-4 h-4 text-gray-400" />
        </a>
      </div>

      <a
        href="https://live.vaikeuvou.app/perfil"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 mt-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold uppercase tracking-wide text-gray-700"
      >
        Editar perfil
        <EditIcon className="w-4 h-4" />
      </a>

      <SairButton />
    </div>
  )
}
