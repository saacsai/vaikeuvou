'use client'

import { useState } from 'react'
import type { Event, Rsvp } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'

type Props = {
  evento: Event
  rsvps: Pick<Rsvp, 'id' | 'user_name' | 'depth_level' | 'created_at'>[]
  parentRsvpId: string | null
}

export default function EventoClient({ evento, rsvps, parentRsvpId }: Props) {
  const [etapa,    setEtapa]    = useState<'convite' | 'form' | 'sucesso'>('convite')
  const [nome,     setNome]     = useState('')
  const [telefone, setTelefone] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [erro,     setErro]     = useState('')
  const [meuRsvpId, setMeuRsvpId] = useState('')

  const base      = typeof window !== 'undefined' ? window.location.origin : 'https://vaikeuvou.app'
  const linkConvite = `${base}/e/${evento.slug}?ref=${meuRsvpId}`
  const whatsappTxt = `Vou no "${evento.title}"! Vai você também? 👉 ${linkConvite}`

  async function confirmar() {
    if (!nome.trim() || !telefone.trim()) { setErro('Preencha seu nome e WhatsApp.'); return }
    setSaving(true)
    setErro('')

    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id:       evento.id,
        user_name:      nome.trim(),
        user_phone:     telefone,
        parent_rsvp_id: parentRsvpId,
      }),
    })
    const json = await res.json()

    if (!res.ok) { setErro(json.error ?? 'Erro ao confirmar. Tente novamente.'); setSaving(false); return }

    setMeuRsvpId(json.rsvp_id)
    setEtapa('sucesso')
    setSaving(false)
  }

  const podeConvidar = evento.max_depth > 1

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Card do evento */}
      <div className="bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 px-5 pt-8 pb-10">
        <p className="text-violet-300 text-xs font-bold uppercase tracking-widest mb-3">vaikeuvou.app</p>
        <h1 className="text-3xl font-extrabold leading-tight mb-4">{evento.title}</h1>

        <div className="space-y-2 text-sm text-violet-200">
          <p>📅 {fmtDate(evento.event_date)}</p>
          {evento.location  && <p>📍 {evento.location}</p>}
          {evento.description && (
            <p className="text-violet-300 text-xs mt-3 leading-relaxed">{evento.description}</p>
          )}
        </div>

        {/* Confirmados */}
        {rsvps.length > 0 && (
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <div className="flex -space-x-2">
              {rsvps.slice(0, 5).map((r, i) => (
                <div key={r.id}
                  className="w-8 h-8 rounded-full bg-violet-500 border-2 border-violet-900 flex items-center justify-center text-xs font-bold text-white"
                  style={{ zIndex: 5 - i }}
                >
                  {r.user_name[0].toUpperCase()}
                </div>
              ))}
            </div>
            <p className="text-xs text-violet-300">
              {rsvps.length === 1
                ? `${rsvps[0].user_name} confirmou`
                : `${rsvps[0].user_name} e mais ${rsvps.length - 1} confirmaram`}
            </p>
          </div>
        )}
      </div>

      {/* Área de ação */}
      <div className="flex-1 px-5 py-8 max-w-lg w-full mx-auto">

        {etapa === 'convite' && (
          <div className="space-y-4">
            <p className="text-gray-300 text-center text-lg font-semibold">Você vai?</p>
            <button
              onClick={() => setEtapa('form')}
              className="w-full py-5 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-extrabold text-2xl transition-colors shadow-lg shadow-green-500/20"
            >
              BORA! 🚀
            </button>
            <p className="text-gray-500 text-xs text-center">
              Confirme sua presença em segundos
            </p>
          </div>
        )}

        {etapa === 'form' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center">Só mais dois campos 😄</h2>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">Seu nome</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Como te chamam?"
                autoFocus
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-base"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">Seu WhatsApp</label>
              <input
                type="tel"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="11 99999-0000"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-base"
              />
            </div>
            {erro && <p className="text-red-400 text-sm">{erro}</p>}
            <button
              onClick={confirmar}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-extrabold text-xl transition-colors"
            >
              {saving ? 'Confirmando…' : 'Confirmar BORA! 🎉'}
            </button>
            <button onClick={() => setEtapa('convite')} className="w-full text-gray-500 text-sm py-2">
              Voltar
            </button>
          </div>
        )}

        {etapa === 'sucesso' && (
          <div className="text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <div>
              <h2 className="text-2xl font-extrabold mb-1">BORA confirmado!</h2>
              <p className="text-gray-400 text-sm">Você está na lista. Nos vemos lá!</p>
            </div>

            {podeConvidar && (
              <div className="bg-gray-900 rounded-2xl p-5 text-left space-y-3">
                <p className="font-bold text-white text-sm">Chama sua galera também 👇</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={linkConvite}
                    className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-xs text-gray-400 font-mono outline-none"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(linkConvite)}
                    className="px-3 py-2 rounded-xl bg-gray-700 text-xs text-white font-semibold whitespace-nowrap hover:bg-gray-600"
                  >
                    Copiar
                  </button>
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappTxt)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm"
                >
                  <span>Enviar no WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
