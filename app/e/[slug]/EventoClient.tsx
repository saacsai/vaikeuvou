'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Event, Rsvp } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'
import { titleToGradient, titleToAccent } from '@/lib/gradient'

type Criador = { name: string | null; avatar_url: string | null }

type Props = {
  evento: Event
  rsvps: Pick<Rsvp, 'id' | 'user_name' | 'depth_level' | 'created_at'>[]
  parentRsvpId: string | null
  criador: Criador | null
}

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

export default function EventoClient({ evento, rsvps, parentRsvpId, criador }: Props) {
  const [etapa,    setEtapa]    = useState<'convite' | 'form' | 'sucesso'>('convite')
  const [nome,     setNome]     = useState('')
  const [telefone, setTelefone] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [erro,     setErro]     = useState('')
  const [meuRsvpId, setMeuRsvpId] = useState('')

  const base        = typeof window !== 'undefined' ? window.location.origin : 'https://vaikeuvou.app'
  const linkConvite = `${base}/e/${evento.slug}?ref=${meuRsvpId}`
  const whatsappTxt = `Vou no "${evento.title}"! Vai você também? 👉 ${linkConvite}`

  const gradient = titleToGradient(evento.title)
  const accent   = titleToAccent(evento.title)

  const criadorNome     = criador?.name ?? 'Anfitrião'
  const criadorAvatar   = criador?.avatar_url
  const criadorIniciais = criadorNome.slice(0, 2).toUpperCase()

  const embedUrl    = evento.video_url ? getVideoEmbed(evento.video_url) : null
  const linkLabel   = evento.external_url_label ?? 'Saiba mais'
  const podeConvidar = evento.max_depth > 1

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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Hero */}
      <div style={{ background: gradient }} className="px-5 pt-8 pb-10">

        {/* Confirmados (avatares) */}
        {rsvps.length > 0 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <div className="flex -space-x-2">
              {rsvps.slice(0, 5).map((r, i) => (
                <div key={r.id}
                  className="w-7 h-7 rounded-full border-2 border-black/30 flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: titleToAccent(r.user_name), zIndex: 5 - i }}
                >
                  {r.user_name[0].toUpperCase()}
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: accent }}>
              {rsvps.length === 1
                ? `${rsvps[0].user_name} confirmou`
                : `${rsvps[0].user_name} e mais ${rsvps.length - 1} confirmaram`}
            </p>
          </div>
        )}

        {/* Título */}
        <h1 className="text-3xl font-extrabold leading-tight mb-4 text-white">{evento.title}</h1>

        {/* Detalhes */}
        <div className="space-y-1.5 text-sm mb-5" style={{ color: accent }}>
          <p>📅 {fmtDate(evento.event_date)}</p>
          {evento.location  && <p>📍 {evento.location}</p>}
          {evento.description && (
            <p className="text-white/60 text-xs mt-3 leading-relaxed">{evento.description}</p>
          )}
        </div>

        {/* Link externo */}
        {evento.external_url && (
          <a
            href={evento.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold mb-5"
            style={{ backgroundColor: accent + '22', color: accent, border: `1px solid ${accent}44` }}
          >
            {linkLabel} ↗
          </a>
        )}

        {/* Assinatura do anfitrião */}
        <div className="flex items-center gap-3 mt-2">
          {criadorAvatar ? (
            <Image
              src={criadorAvatar}
              alt={criadorNome}
              width={36} height={36}
              className="w-9 h-9 rounded-full object-cover border-2 border-white/20"
              unoptimized
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white/20"
              style={{ backgroundColor: accent, color: '#111' }}
            >
              {criadorIniciais}
            </div>
          )}
          <div>
            <p className="text-xs text-white/50">organizado por</p>
            <p className="text-sm font-semibold text-white">{criadorNome}</p>
          </div>
          <div className="ml-auto">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">vaikeuvou</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex-1 px-5 py-8 max-w-lg w-full mx-auto">

        {etapa === 'convite' && (
          <div className="space-y-4">
            <p className="text-white text-center text-xl font-bold">E aí? Vamos? 🎉</p>
            <button
              onClick={() => setEtapa('form')}
              className="w-full py-5 rounded-2xl text-white font-extrabold text-2xl transition-colors shadow-lg"
              style={{ backgroundColor: titleToAccent(evento.title).replace('75%', '45%') }}
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
                  Enviar no WhatsApp
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vídeo embed */}
      {embedUrl && (
        <div className="px-5 pb-10 max-w-lg w-full mx-auto">
          <div className="rounded-2xl overflow-hidden aspect-video">
            <iframe
              src={embedUrl}
              title="Vídeo do evento"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

    </div>
  )
}
