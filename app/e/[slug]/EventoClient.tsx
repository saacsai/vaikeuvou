'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
import type { Event, Rsvp } from '@/lib/supabase'
import { fmtDate, fmtDateRange } from '@/lib/slug'

function fmtHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(iso))
}
import { titleToHeader } from '@/lib/headers'
import SucessoConviteModal from '@/components/SucessoConviteModal'
import ConfirmarPresencaModal from '@/components/ConfirmarPresencaModal'

type Criador = { name: string | null; avatar_url: string | null; bio: string | null; instagram: string | null }
type Convidador = { user_name: string; foto_url: string | null; mensagem: string | null } | null

type Props = {
  evento: Event
  rsvps: Pick<Rsvp, 'id' | 'user_name' | 'depth_level' | 'created_at'>[]
  parentRsvpId: string | null
  criador: Criador | null
  convidador: Convidador
  sessionUser: { name: string; phone: string } | null
}

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

export default function EventoClient({ evento, rsvps, parentRsvpId, criador, convidador, sessionUser }: Props) {
  const [etapa,    setEtapa]    = useState<'convite' | 'form' | 'aguardando_pagamento' | 'sucesso'>('convite')
  const [nome,     setNome]     = useState(sessionUser?.name ?? '')
  const [telefone, setTelefone] = useState(sessionUser?.phone ?? '')
  const [saving,   setSaving]   = useState(false)
  const [erro,     setErro]     = useState('')
  const [meuRsvpId, setMeuRsvpId] = useState('')
  const [modalAberto, setModalAberto] = useState(true)

  const searchParams = useSearchParams()
  const pago = !!evento.valor && evento.valor > 0

  // Volta do Mercado Pago — o webhook pode ainda não ter processado, faz
  // polling curto até o RSVP aparecer (ver /api/rsvp/checkout + webhook).
  useEffect(() => {
    if (!searchParams.get('rsvp_ok')) return
    const telefonePendente = sessionStorage.getItem('vkv_pending_telefone')
    if (!telefonePendente) return

    setEtapa('aguardando_pagamento')
    let tentativas = 0
    const intervalo = setInterval(async () => {
      tentativas++
      const res  = await fetch(`/api/rsvp/by-payment?event_id=${evento.id}&telefone=${encodeURIComponent(telefonePendente)}`)
      const json = await res.json()
      if (json.rsvp_id) {
        clearInterval(intervalo)
        sessionStorage.removeItem('vkv_pending_telefone')
        setMeuRsvpId(json.rsvp_id)
        setEtapa('sucesso')
      } else if (tentativas >= 10) {
        clearInterval(intervalo)
        setErro('Pagamento recebido, mas a confirmação está demorando — atualize a página em instantes.')
        setEtapa('convite')
      }
    }, 1500)
    return () => clearInterval(intervalo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const base        = typeof window !== 'undefined' ? window.location.origin : 'https://live.vaikeuvou.app'
  const linkConvite = `${base}/e/${evento.slug}?ref=${meuRsvpId}`
  const whatsappTxt = `Eu vou no "${evento.title}"! Vamo aí? 👉 ${linkConvite}`

  const header = evento.bg_image_url
    ? { src: evento.bg_image_url, bg: '#f5f5f4' }
    : titleToHeader(evento.title)

  const criadorNome      = criador?.name ?? 'Anfitrião'
  const criadorAvatar    = criador?.avatar_url
  const criadorBio       = criador?.bio
  const criadorInstagram = criador?.instagram
  const criadorIniciais  = criadorNome.slice(0, 2).toUpperCase()

  // Personalização em cascata: quem chegou via reenvio (?ref=) vê a foto e a
  // mensagem de quem especificamente convidou, nunca a do criador raiz —
  // sem foto/mensagem customizada, cai num cartão genérico (iniciais de quem
  // convidou + frase padrão), nunca herda a foto do criador por engano.
  const heroNome      = convidador ? convidador.user_name : criadorNome
  const heroAvatar     = convidador ? convidador.foto_url : criadorAvatar
  const heroIniciais   = heroNome.slice(0, 2).toUpperCase()
  const heroMensagem   = convidador
    ? (convidador.mensagem || `${convidador.user_name} te convidou! Vamo aí?`)
    : null

  const embedUrl    = evento.video_url ? getVideoEmbed(evento.video_url) : null
  const linkLabel   = evento.external_url_label ?? 'Saiba mais'
  const podeConvidar = evento.max_depth > 1
  const refFimEvento = evento.event_date_fim ? `${evento.event_date_fim}T23:59:59-03:00` : evento.event_date
  const isPast       = new Date(refFimEvento).getTime() < Date.now()
  const fimIso        = evento.duration_minutes
    ? new Date(new Date(evento.event_date).getTime() + evento.duration_minutes * 60000).toISOString()
    : null

  async function confirmar() {
    if (isPast) return
    if (!nome.trim() || !telefone.trim()) { setErro('Preencha seu nome e WhatsApp.'); return }
    setSaving(true)
    setErro('')

    const payload = {
      event_id:       evento.id,
      user_name:      nome.trim(),
      user_phone:     telefone,
      parent_rsvp_id: parentRsvpId,
    }

    // Evento pago: abre o checkout do Mercado Pago — o RSVP só é criado depois que o
    // pagamento for confirmado (ver /api/rsvp/checkout).
    if (pago) {
      const res  = await fetch('/api/rsvp/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json) { setErro(json?.error ?? 'Erro ao abrir pagamento. Tente novamente.'); setSaving(false); return }
      if (json.ja_confirmado) { setMeuRsvpId(json.rsvp_id); setEtapa('sucesso'); setSaving(false); return }
      // O telefone some do estado no reload pós-redirect do MP — guarda pra
      // retomar o polling do pagamento quando a pessoa voltar.
      sessionStorage.setItem('vkv_pending_telefone', telefone)
      // Navegação via <a rel="noreferrer"> em vez de window.location.href —
      // o checkout da MP se comporta diferente (botão de pagar não habilita)
      // quando detecta o Referer vindo do vaikeuvou; sem referrer funciona
      // igual a colar o link direto na barra de endereço.
      const a = document.createElement('a')
      a.href = json.url
      a.rel  = 'noreferrer'
      document.body.appendChild(a)
      a.click()
      return
    }

    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => null)

    if (!res.ok || !json) { setErro(json?.error ?? 'Erro ao confirmar. Tente novamente.'); setSaving(false); return }

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
          <Image src="/logo.png" alt="vaikeuvou" width={1557} height={354} className="w-[250px] max-w-full h-auto mb-4" />

          {/* Título — continua a frase do wordmark: "vai que eu vou" + título */}
          <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-3">{evento.title}</h1>

          {/* Detalhes */}
          <div className="space-y-3 text-sm text-gray-500 mb-[26px]">
            <p>📅 {evento.event_date_fim ? fmtDateRange(evento.event_date, evento.event_date_fim) : fmtDate(evento.event_date)}{!evento.event_date_fim && fimIso && ` às ${fmtHora(fimIso)}`}</p>
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
            {pago && (
              <div>
                <p className="flex items-center gap-1.5 flex-wrap">
                  <span>💳</span>
                  <span className="font-semibold text-gray-700">{fmtBRL(evento.valor!)} por pessoa</span>
                </p>
                {evento.max_parcelas > 1 && (
                  <p className="text-[11px] text-gray-400 mt-0.5">Parcelamento em até 12x no cartão de crédito, consulte condições no pagamento</p>
                )}
              </div>
            )}
          </div>

          {(evento.descricao_pacote || evento.programacao) && (
            <div className="mb-[26px]">
              {evento.descricao_pacote && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">O que está incluso</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{evento.descricao_pacote}</p>
                </div>
              )}
              {evento.programacao && (
                <div className="mt-[30px]">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Programação</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{evento.programacao}</p>
                </div>
              )}
            </div>
          )}

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

          {/* Anfitrião (ou, via reenvio, quem convidou) + recado */}
          <div className="flex items-center gap-3 mb-5">
            {heroAvatar ? (
              <Image src={heroAvatar} alt={heroNome} width={100} height={100}
                className="w-[100px] h-[100px] rounded-full object-cover flex-shrink-0" unoptimized />
            ) : (
              <div className="w-[100px] h-[100px] rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-gray-600 flex-shrink-0">
                {heroIniciais}
              </div>
            )}
            <div className="min-w-0">
              {heroMensagem ? (
                <p className="text-sm text-gray-700 italic">&ldquo;{heroMensagem}&rdquo;</p>
              ) : evento.description ? (
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
                disabled={saving}
                className="w-full py-4 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 transition-colors shadow-lg shadow-brand/20 flex items-center justify-center gap-[5px]"
              >
                <span className="text-white font-bold text-2xl uppercase tracking-wide">BORA</span>
                <Image src="/icone_bora.png" alt="" width={474} height={537} className="h-8 w-auto" />
              </button>
              {erro && <p className="text-red-500 text-sm">{erro}</p>}
            </div>
          )}

          {etapa === 'form' && (
            <ConfirmarPresencaModal
              tituloEvento={evento.title}
              pago={pago}
              valor={evento.valor}
              maxParcelas={evento.max_parcelas}
              nome={nome}
              telefone={telefone}
              onNomeChange={setNome}
              onTelefoneChange={setTelefone}
              onConfirmar={confirmar}
              onClose={() => setEtapa('convite')}
              saving={saving}
              erro={erro}
            />
          )}

          {etapa === 'aguardando_pagamento' && (
            <div className="text-center space-y-3 py-4">
              <div className="text-4xl animate-pulse">⏳</div>
              <p className="text-gray-700 font-semibold text-sm">Confirmando seu pagamento…</p>
              <p className="text-gray-400 text-xs">Isso leva só alguns segundos.</p>
            </div>
          )}

          {etapa === 'sucesso' && (
            <div className="text-center space-y-5">
              <div className="text-5xl">🎉</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{pago ? 'Pagamento confirmado!' : 'BORA confirmado!'}</h2>
                <p className="text-gray-500 text-sm">Você está na lista. Nos vemos lá!</p>
              </div>
            </div>
          )}

          {etapa === 'sucesso' && podeConvidar && meuRsvpId && modalAberto && (
            <SucessoConviteModal
              rsvpId={meuRsvpId}
              nome={nome}
              pago={pago}
              linkConvite={linkConvite}
              whatsappTxt={whatsappTxt}
              onClose={() => setModalAberto(false)}
            />
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
