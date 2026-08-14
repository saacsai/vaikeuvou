'use client'

import { useState } from 'react'
import type { Event, Rsvp } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'

type Props = { evento: Event; rsvps: Rsvp[]; isNovo: boolean }

export default function DashboardClient({ evento, rsvps, isNovo }: Props) {
  const [copiado, setCopiado] = useState(false)

  // Editar campos
  const [editOpen,    setEditOpen]    = useState(false)
  const [extUrl,      setExtUrl]      = useState(evento.external_url ?? '')
  const [extLabel,    setExtLabel]    = useState(evento.external_url_label ?? '')
  const [videoUrl,    setVideoUrl]    = useState(evento.video_url ?? '')
  const [editSaving,  setEditSaving]  = useState(false)
  const [editMsg,     setEditMsg]     = useState('')

  const base          = typeof window !== 'undefined' ? window.location.origin : 'https://vaikeuvou.app'
  const linkEvento    = `${base}/e/${evento.slug}`
  const linkDashboard = `${base}/dashboard/${evento.edit_token}`

  const nivel1 = rsvps.filter(r => r.depth_level === 1)
  const nivel2 = rsvps.filter(r => r.depth_level === 2)
  const nivel3 = rsvps.filter(r => r.depth_level >= 3)

  function copiar(txt: string) {
    navigator.clipboard.writeText(txt)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function salvarEdicao() {
    setEditSaving(true)
    setEditMsg('')
    const res = await fetch('/api/eventos/editar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edit_token:         evento.edit_token,
        external_url:       extUrl,
        external_url_label: extLabel,
        video_url:          videoUrl,
      }),
    })
    const json = await res.json()
    setEditMsg(res.ok ? 'Salvo! Recarregue a página do evento para ver.' : (json.error ?? 'Erro ao salvar.'))
    setEditSaving(false)
  }

  const whatsappTxt = `Você está convidado para "${evento.title}"! Confirme sua presença: ${linkEvento}`

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/meus-eventos" className="text-gray-500 text-xs hover:text-gray-400">← Meus eventos</a>
          </div>
          <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-1">vaikeuvou.app</p>
          <h1 className="text-2xl font-extrabold leading-tight">{evento.title}</h1>
          <p className="text-gray-400 text-sm mt-1">{fmtDate(evento.event_date)}</p>
          {evento.location && <p className="text-gray-500 text-xs mt-0.5">📍 {evento.location}</p>}
        </div>

        {/* Aviso evento criado */}
        {isNovo && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <p className="text-green-400 font-bold text-sm">🎉 Evento criado com sucesso!</p>
            <p className="text-green-300 text-xs mt-1">
              Salve este link de painel — é a única forma de acessar este dashboard.
            </p>
          </div>
        )}

        {/* Contadores */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',    count: rsvps.length,                  cor: 'text-violet-400' },
            { label: 'Nível 1',  count: nivel1.length,                 cor: 'text-blue-400' },
            { label: 'Nível 2+', count: nivel2.length + nivel3.length, cor: 'text-pink-400' },
          ].map(c => (
            <div key={c.label} className="bg-gray-900 rounded-2xl p-4 text-center">
              <p className={`text-3xl font-extrabold ${c.cor}`}>{c.count}</p>
              <p className="text-gray-500 text-xs mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Link do evento */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Link do convite</p>
          <div className="flex gap-2">
            <input
              readOnly value={linkEvento}
              className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-xs text-gray-400 font-mono outline-none"
            />
            <button
              onClick={() => copiar(linkEvento)}
              className="px-3 py-2 rounded-xl bg-gray-700 text-xs font-semibold text-white hover:bg-gray-600"
            >
              {copiado ? '✓' : 'Copiar'}
            </button>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappTxt)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm"
          >
            Compartilhar no WhatsApp
          </a>
        </div>

        {/* Editar evento */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <button
            onClick={() => setEditOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Editar evento</p>
            <span className="text-gray-500 text-sm">{editOpen ? '▲' : '▼'}</span>
          </button>

          {editOpen && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Link externo
                </label>
                <input
                  value={extUrl}
                  onChange={e => setExtUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Texto do botão
                </label>
                <input
                  value={extLabel}
                  onChange={e => setExtLabel(e.target.value)}
                  placeholder="Ex: Comprar ingresso 🎟️"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Vídeo (YouTube ou Vimeo)
                </label>
                <input
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  type="url"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm"
                />
                <p className="text-[10px] text-gray-600 mt-1">Aparece abaixo do botão BORA na página do evento</p>
              </div>

              {editMsg && (
                <p className={`text-xs ${editMsg.includes('Salvo') ? 'text-green-400' : 'text-red-400'}`}>{editMsg}</p>
              )}

              <button
                onClick={salvarEdicao}
                disabled={editSaving}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm transition-colors"
              >
                {editSaving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          )}
        </div>

        {/* Lista de confirmados */}
        {rsvps.length > 0 ? (
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Confirmados</p>
            <div className="space-y-2">
              {rsvps.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                      {r.user_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{r.user_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    r.depth_level === 1 ? 'bg-blue-500/10 text-blue-400' :
                    r.depth_level === 2 ? 'bg-pink-500/10 text-pink-400' :
                    'bg-orange-500/10 text-orange-400'
                  }`}>
                    Nível {r.depth_level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">👀</p>
            <p className="text-gray-400 text-sm">Nenhuma confirmação ainda.</p>
            <p className="text-gray-500 text-xs mt-1">Compartilhe o link e aguarde o pessoal confirmar!</p>
          </div>
        )}

        {/* Link do dashboard */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 space-y-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Link deste painel (salve!)</p>
          <div className="flex gap-2">
            <input
              readOnly value={linkDashboard}
              className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-[10px] text-gray-500 font-mono outline-none"
            />
            <button
              onClick={() => copiar(linkDashboard)}
              className="px-3 py-2 rounded-xl bg-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-600"
            >
              Copiar
            </button>
          </div>
          <p className="text-[10px] text-gray-600">Não compartilhe este link — só você deve ter acesso.</p>
        </div>

      </div>
    </div>
  )
}
