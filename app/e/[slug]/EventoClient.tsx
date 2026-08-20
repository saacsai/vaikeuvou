'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Event, Rsvp } from '@/lib/supabase'
import { fmtDate } from '@/lib/slug'
import { titleToHeader } from '@/lib/headers'

type Criador = { name: string | null; avatar_url: string | null; bio: string | null; instagram: string | null }

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

  const criadorNome      = criador?.name ?? 'Anfitrião'
  const criadorAvatar    = criador?.avatar_url
  const criadorBio       = criador?.bio
  const criadorInstagram = criador?.instagram
  const criadorIniciais  = criadorNome.slice(0, 2).toUpperCase()

  const embedUrl    = evento.video_url ? getVideoEmbed(evento.video_url) : null
  const linkLabel   = evento.external_url_label ?? 'Saiba mais'
  const podeConvidar = evento.max_depth > 1
  const isPast       = new Date(evento.event_date).getTime() < Date.now()

  async function confirmar() {
    if (isPast) return
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
      <div className="relative w-full max-w-lg bg-white sm:my-8 sm:rounded-lg sm:shadow-xl overflow-hidden">

        {isPast && (
          <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-[2px] flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-3xl mb-2">🕓</p>
              <p className="text-gray-700 font-bold text-lg">Esse evento já aconteceu.</p>
              <p className="text-gray-400 text-sm mt-1">Confirmações de presença foram encerradas.</p>
            </div>
          </div>
        )}

        {/* Banner — proporção medida do mockup: ~22% da altura do card */}
        <div className="relative w-full aspect-[2.4/1]">
          <Image src={header.src} alt="" fill unoptimized className="object-cover" />
        </div>

        <div className="px-6 pt-6 pb-8 bg-gradient-to-b from-white to-[#fcede1]">

          {/* Marca */}
          <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="w-[250px] max-w-full h-auto mb-4" />

          {/* Título — continua a frase do wordmark: "vai que eu vou" + título */}
          <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-3">{evento.title}</h1>

          {/* Detalhes */}
          <div className="space-y-3 text-sm text-gray-500 mb-[26px]">
            <p>📅 {fmtDate(evento.event_date)}</p>
            {evento.location && (
              <div className="flex items-center gap-1.5 w-fit">
                <span>📍</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evento.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-gray-500"
                >
                  {evento.location}
                </a>
              </div>
            )}
            {evento.external_url && (
              <div className="flex items-center gap-1.5 w-fit">
                <span>🔗</span>
                <a
                  href={evento.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-gray-500"
                >
                  {linkLabel}
                </a>
              </div>
            )}
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
          <div className="flex items-center gap-3 mb-5">
            {criadorAvatar ? (
              <Image src={criadorAvatar} alt={criadorNome} width={100} height={100}
                className="w-[100px] h-[100px] rounded-full object-cover flex-shrink-0" unoptimized />
            ) : (
              <div className="w-[100px] h-[100px] rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-gray-600 flex-shrink-0">
                {criadorIniciais}
              </div>
            )}
            <div className="min-w-0">
              {evento.description ? (
                <p className="text-sm text-gray-700 italic">&ldquo;{evento.description}&rdquo;</p>
              ) : (
                <p className="text-sm text-gray-400">Organizado por {criadorNome}</p>
              )}
            </div>
          </div>

          {/* CTA */}
          {etapa === 'convite' && (
            <div className="space-y-3">
              <p className="text-gray-900 font-semibold text-[23px]">Vamo aí?</p>
              <button
                onClick={() => setEtapa('form')}
                className="w-full py-4 rounded-lg bg-brand hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20 flex items-center justify-center gap-[5px]"
              >
                <Image src="/letra_bora.png" alt="BORA" width={130} height={53} className="h-7 w-auto" />
                <Image src="/icone_bora.png" alt="" width={57} height={61} className="h-8 w-auto" />
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
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Ao confirmar, você concorda com os{' '}
                <a href="/termos" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Termos de Uso</a>
                {' '}e a{' '}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Política de Privacidade</a>.
              </p>
              <button
                onClick={confirmar}
                disabled={saving}
                className="w-full py-4 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-lg uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  'Confirmando…'
                ) : (
                  <>
                    <span className="flex items-center gap-[5px]">
                      <Image src="/letra_bora.png" alt="BORA" width={130} height={53} className="h-6 w-auto" />
                      <Image src="/icone_bora.png" alt="" width={57} height={61} className="h-7 w-auto" />
                    </span>
                    Confirmar
                  </>
                )}
              </button>
              <button onClick={() => setEtapa('convite')} className="w-full text-gray-400 text-sm py-2 uppercase tracking-wide">
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
                      className="px-3 py-2 rounded-xl bg-gray-200 text-xs text-gray-700 font-semibold uppercase tracking-wide whitespace-nowrap hover:bg-gray-300"
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
            <div className="mt-6 rounded-lg overflow-hidden aspect-video">
              <iframe
                src={embedUrl}
                title="Vídeo do convite"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          <div className="mt-6 space-y-1">
            <p className="text-xs text-gray-400">Organizado por <span className="font-semibold text-gray-500">{criadorNome}</span></p>
            {criadorBio && <p className="text-xs text-gray-400">{criadorBio}</p>}
            {criadorInstagram && (
              <a
                href={`https://instagram.com/${criadorInstagram}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-brand transition-colors"
                aria-label={`Instagram de ${criadorNome}`}
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <a href={base} target="_blank" rel="noopener noreferrer" className="text-[11px] text-black/70 hover:text-black transition-colors">
              Crie seu convite grátis em vaikeuvou.app
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
