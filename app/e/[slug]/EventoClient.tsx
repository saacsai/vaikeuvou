'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Event, Rsvp } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'
import { titleToHeader } from '@/lib/headers'

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

  const header = evento.bg_image_url
    ? { src: evento.bg_image_url, bg: '#f5f5f4' }
    : titleToHeader(evento.title)

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
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: header.bg }}>
      <div className="w-full max-w-lg bg-white sm:my-8 sm:rounded-3xl sm:shadow-xl overflow-hidden">

        {/* Banner — proporção medida do mockup: ~22% da altura do card */}
        <div className="relative w-full aspect-[2.4/1]">
          <Image src={header.src} alt="" fill unoptimized className="object-cover" />
        </div>

        <div className="px-6 pt-6 pb-8" style={{ backgroundColor: header.bg }}>

          {/* Marca */}
          <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="w-[298px] max-w-full h-auto mb-4" />

          {/* Título — continua a frase do wordmark: "vai que eu vou" + título */}
          <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-3">{evento.title}</h1>

          {/* Detalhes */}
          <div className="space-y-1 text-sm text-gray-500 mb-4">
            <p>📅 {fmtDate(evento.event_date)}</p>
            {evento.location && <p>📍 {evento.location}</p>}
          </div>

          {/* Confirmados */}
          {rsvps.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <div className="flex -space-x-2">
                {rsvps.slice(0, 5).map((r, i) => (
                  <div key={r.id}
                    className="w-7 h-7 rounded-full border-2 border-white bg-brand flex items-center justify-center text-xs font-bold text-white"
                    style={{ zIndex: 5 - i }}
                  >
                    {r.user_name[0].toUpperCase()}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {rsvps.length === 1
                  ? `${rsvps[0].user_name} confirmou`
                  : `${rsvps[0].user_name} e mais ${rsvps.length - 1} confirmaram`}
              </p>
            </div>
          )}

          {/* Anfitrião + recado */}
          <div className="flex items-start gap-3 mb-5">
            {criadorAvatar ? (
              <Image src={criadorAvatar} alt={criadorNome} width={40} height={40}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0" unoptimized />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                {criadorIniciais}
              </div>
            )}
            <div>
              {evento.description ? (
                <p className="text-sm text-gray-700 italic">&ldquo;{evento.description}&rdquo;</p>
              ) : (
                <p className="text-sm text-gray-400">Organizado por {criadorNome}</p>
              )}
            </div>
          </div>

          {/* Link externo */}
          {evento.external_url && (
            <a
              href={evento.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold mb-5 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {linkLabel} ↗
            </a>
          )}

          {/* CTA */}
          {etapa === 'convite' && (
            <div className="space-y-3">
              <p className="text-gray-900 font-semibold text-lg">Vamo aí?</p>
              <button
                onClick={() => setEtapa('form')}
                className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xl tracking-wide transition-colors shadow-lg shadow-brand/20"
              >
                BORA 🏃
              </button>
            </div>
          )}

          {etapa === 'form' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Só mais dois campos 😄</h2>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Seu nome</label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Como te chamam?"
                  autoFocus
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Seu WhatsApp</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  placeholder="11 99999-0000"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
                />
              </div>
              {erro && <p className="text-red-500 text-sm">{erro}</p>}
              <button
                onClick={confirmar}
                disabled={saving}
                className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-lg transition-colors"
              >
                {saving ? 'Confirmando…' : 'Confirmar BORA! 🎉'}
              </button>
              <button onClick={() => setEtapa('convite')} className="w-full text-gray-400 text-sm py-2">
                Voltar
              </button>
            </div>
          )}

          {etapa === 'sucesso' && (
            <div className="text-center space-y-5">
              <div className="text-5xl">🎉</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">BORA confirmado!</h2>
                <p className="text-gray-500 text-sm">Você está na lista. Nos vemos lá!</p>
              </div>

              {podeConvidar && (
                <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3">
                  <p className="font-bold text-gray-900 text-sm">Chama sua galera também 👇</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={linkConvite}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono outline-none"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(linkConvite)}
                      className="px-3 py-2 rounded-xl bg-gray-200 text-xs text-gray-700 font-semibold whitespace-nowrap hover:bg-gray-300"
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

          {/* Vídeo embed */}
          {embedUrl && (
            <div className="mt-6 rounded-2xl overflow-hidden aspect-video">
              <iframe
                src={embedUrl}
                title="Vídeo do evento"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          <p className="text-xs text-gray-400 mt-6">Organizado por <span className="font-semibold text-gray-500">{criadorNome}</span></p>
        </div>
      </div>
    </div>
  )
}
