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
  credits: number
  created_at: string
}

export default function UsuarioRow({ usuario, comprou }: { usuario: Usuario; comprou: boolean }) {
  const [aberto,   setAberto]   = useState(false)
  const [valor,    setValor]    = useState('')
  const [motivo,   setMotivo]   = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState('')
  const [saldo,    setSaldo]    = useState(usuario.credits)

  const iniciais = (usuario.name || usuario.phone).slice(0, 2).toUpperCase()

  async function darCreditos() {
    const amount = parseInt(valor, 10)
    if (!amount || amount <= 0) { setErro('Informe uma quantidade válida.'); return }
    if (!motivo.trim()) { setErro('Informe o motivo.'); return }

    setSalvando(true); setErro('')
    const res = await fetch('/api/admin/creditos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: usuario.id, amount, reason: motivo.trim() }),
    })
    const json = await res.json()

    if (!res.ok) { setErro(json.error ?? 'Erro ao dar créditos.'); setSalvando(false); return }

    setSaldo(s => s + amount)
    setValor(''); setMotivo(''); setAberto(false); setSalvando(false)
  }

  return (
    <>
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
        <td className="px-4 py-3 font-mono text-gray-700">{saldo}</td>
        <td className="px-4 py-3">
          {comprou ? (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">sim</span>
          ) : (
            <span className="text-xs text-gray-400">não</span>
          )}
        </td>
        <td className="px-4 py-3 text-gray-500 text-xs">
          {new Date(usuario.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setAberto(a => !a)} className="text-xs font-semibold text-brand hover:opacity-80">
            {aberto ? 'Cancelar' : 'Dar créditos'}
          </button>
        </td>
      </tr>
      {aberto && (
        <tr className="bg-brand/5 border-b border-gray-50">
          <td colSpan={6} className="px-4 py-3">
            <div className="flex items-end gap-2 flex-wrap">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Quantidade</label>
                <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="50"
                  className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Motivo</label>
                <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Bônus — primeira usuária a criar evento"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand" />
              </div>
              <button onClick={darCreditos} disabled={salvando}
                className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wide">
                {salvando ? 'Salvando…' : 'Confirmar'}
              </button>
            </div>
            {erro && <p className="text-red-500 text-xs mt-2">{erro}</p>}
          </td>
        </tr>
      )}
    </>
  )
}
