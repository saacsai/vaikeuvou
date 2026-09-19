'use client'

import { useState } from 'react'
import Image from 'next/image'

type Usuario = {
  id: string
  name: string | null
  phone: string
  avatar_url: string | null
  bio: string | null
  instagram: string | null
  created_at: string
  comissao_percentual: number | null
}

export default function UsuarioRow({ usuario }: { usuario: Usuario }) {
  const iniciais = (usuario.name || usuario.phone).slice(0, 2).toUpperCase()

  const [comissao, setComissao] = useState(usuario.comissao_percentual)
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(usuario.comissao_percentual?.toString() ?? '')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    const valor = rascunho.trim() === '' ? null : Number(rascunho)
    const res = await fetch('/api/admin/usuarios/comissao', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: usuario.id, comissao_percentual: valor }),
    })
    if (res.ok) {
      setComissao(valor)
      setEditando(false)
    }
    setSalvando(false)
  }

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
      <td className="px-4 py-3">
        {editando ? (
          <div className="flex items-center gap-1.5">
            <input
              value={rascunho}
              onChange={e => setRascunho(e.target.value)}
              placeholder="15"
              type="number" min={0} max={100} step="0.5"
              className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-900 outline-none focus:border-brand"
              autoFocus
            />
            <button
              onClick={salvar}
              disabled={salvando}
              className="text-[10px] font-bold px-2 py-1 rounded bg-brand text-white uppercase tracking-wide disabled:opacity-50"
            >
              ✓
            </button>
            <button
              onClick={() => { setEditando(false); setRascunho(comissao?.toString() ?? '') }}
              className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-500 uppercase tracking-wide"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="text-xs font-semibold text-gray-600 hover:text-brand"
          >
            {comissao !== null ? `${comissao}%` : <span className="text-gray-300">padrão (15%)</span>}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {new Date(usuario.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3" />
    </tr>
  )
}
