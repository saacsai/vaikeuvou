'use client'

import Image from 'next/image'

type Usuario = {
  id: string
  name: string | null
  phone: string
  avatar_url: string | null
  bio: string | null
  instagram: string | null
  created_at: string
}

export default function UsuarioRow({ usuario }: { usuario: Usuario }) {
  const iniciais = (usuario.name || usuario.phone).slice(0, 2).toUpperCase()

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {usuario.avatar_url ? (
            <Image src={usuario.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover flex-shrink-0" unoptimized />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{iniciais}</div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{usuario.name || '—'}</p>
            <p className="text-xs text-gray-400">{usuario.phone}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${usuario.bio ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-300'}`}>bio</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${usuario.instagram ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-300'}`}>insta</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {new Date(usuario.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3" />
    </tr>
  )
}
