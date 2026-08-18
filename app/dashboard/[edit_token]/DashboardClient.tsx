'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Event, Rsvp } from '@/lib/supabase'
import DatePicker from '@/components/DatePicker'
import TimePicker from '@/components/TimePicker'
import { ProfilePopover, GridIcon } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'
import EventPreviewCard from '@/components/EventPreviewCard'
import BgSelector from '@/components/BgSelector'
import CreditLockPanel from '@/components/CreditLockPanel'
import { fmtDate } from '@/lib/slug'
import type { EventFormFields } from '@/lib/eventForm'

const PRIVACIDADE = [
  { value: 1,   label: 'Privado',          desc: 'Só você convida' },
  { value: 2,   label: 'Amigos de amigos', desc: 'Quem confirmar pode convidar' },
  { value: 999, label: 'Aberto',           desc: 'Viralização ilimitada' },
]

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

type Props = {
  evento: Event
  rsvps: Rsvp[]
  isNovo: boolean
  userName: string | null
  userAvatar: string | null
  userBio: string | null
  userInstagram: string | null
  userCredits: number
  isOwner: boolean
}

const UNLOCK_COST = 3
const DATE_UNLOCK_COST = 2

function parseEventDate(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { date: '', time: '' }

  // Supabase devolve o timestamp em UTC — precisa converter pro fuso de
  // exibição (America/Sao_Paulo) antes de extrair data/hora, senão o
  // horário salvo em -03:00 vem deslocado (ex: 21:00 vira 00:00 do dia
  // seguinte se lido cru da string).
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

function fmtDataHora(date: string, time: string): string {
  if (!date) return ''
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y} às ${time}`
}

function toForm(evento: Event): EventFormFields {
  const { date, time } = parseEventDate(evento.event_date)
  return {
    title: evento.title,
    event_date: date,
    event_time: time,
    location: evento.location ?? '',
    description: evento.description ?? '',
    max_depth: evento.max_depth,
    external_url: evento.external_url ?? '',
    external_url_label: evento.external_url_label ?? '',
    video_url: evento.video_url ?? '',
    bg_image_url: evento.bg_image_url ?? '',
  }
}

export default function DashboardClient({ evento, rsvps, isNovo, userName, userAvatar, userBio, userInstagram, userCredits, isOwner }: Props) {
  const [initial,   setInitial]   = useState<EventFormFields>(() => toForm(evento))
  const [form,      setForm]      = useState<EventFormFields>(() => toForm(evento))
  const [copiado,   setCopiado]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState('')
  const [editando,  setEditando]  = useState(false)
  const [unlocked,  setUnlocked]  = useState(!!evento.guest_list_unlocked_at)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockErro, setUnlockErro] = useState('')
  const [creditsLeft, setCreditsLeft] = useState(userCredits)

  const [videoStage,     setVideoStage]     = useState<'idle' | 'confirm' | 'unlocked'>('idle')
  const [videoUnlocking, setVideoUnlocking] = useState(false)
  const [videoErro,      setVideoErro]      = useState('')

  // Troca de data: primeira é grátis, da segunda em diante trava e cobra
  // DATE_UNLOCK_COST a cada troca — nunca volta a ser grátis.
  const [dateChangesCount, setDateChangesCount] = useState(evento.date_changes_count)
  const [dateStage,        setDateStage]        = useState<'idle' | 'confirm' | 'unlocked'>('idle')
  const [dateUnlocking,    setDateUnlocking]    = useState(false)
  const [dateErro,         setDateErro]         = useState('')

  async function desbloquearData() {
    setDateUnlocking(true)
    setDateErro('')
    const res = await fetch('/api/creditos/desbloquear-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edit_token: evento.edit_token }),
    })
    const json = await res.json()
    if (!res.ok) { setDateErro(json.error ?? 'Erro ao desbloquear.'); setDateUnlocking(false); return }
    setDateStage('unlocked')
    setCreditsLeft(c => c - DATE_UNLOCK_COST)
    setDateUnlocking(false)
  }

  async function desbloquearVideo() {
    setVideoUnlocking(true)
    setVideoErro('')
    const res = await fetch('/api/creditos/desbloquear-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edit_token: evento.edit_token }),
    })
    const json = await res.json()
    if (!res.ok) { setVideoErro(json.error ?? 'Erro ao desbloquear.'); setVideoUnlocking(false); return }
    setVideoStage('unlocked')
    setCreditsLeft(c => c - 1)
    setVideoUnlocking(false)
  }

  function onHeaderImageUploaded(url: string) {
    setForm(p => ({ ...p, bg_image_url: url }))
    setInitial(p => ({ ...p, bg_image_url: url }))
    setCreditsLeft(c => c - 1)
  }

  async function desbloquear() {
    if (!window.confirm(`Desbloquear vai debitar ${UNLOCK_COST} créditos do seu saldo. Confirma?`)) return
    setUnlocking(true)
    setUnlockErro('')
    const res = await fetch('/api/creditos/desbloquear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edit_token: evento.edit_token }),
    })
    const json = await res.json()
    if (!res.ok) { setUnlockErro(json.error ?? 'Erro ao desbloquear.'); setUnlocking(false); return }
    setCreditsLeft(c => c - UNLOCK_COST)
    setUnlocked(true)
    setUnlocking(false)
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  function set(k: keyof EventFormFields, v: string | number) {
    setForm(p => ({ ...p, [k]: v }))
  }

  const linkConvite = `https://vaikeuvou.app/e/${evento.slug}`
  const isPast = new Date(evento.event_date).getTime() < Date.now()

  const nivel1 = rsvps.filter(r => r.depth_level === 1)
  const nivel2 = rsvps.filter(r => r.depth_level === 2)
  const nivel3 = rsvps.filter(r => r.depth_level >= 3)

  function copiar(txt: string) {
    navigator.clipboard.writeText(txt)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function salvar() {
    if (!form.title || !form.event_date || !form.event_time) {
      setMsg('Preencha pelo menos o título, a data e o horário.')
      return
    }
    setSaving(true)
    setMsg('')

    const event_date = `${form.event_date}T${form.event_time}:00-03:00`

    const res = await fetch('/api/eventos/editar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edit_token: evento.edit_token, ...form, event_date }),
    })
    const json = await res.json()

    if (!res.ok) { setMsg(json.error ?? 'Erro ao salvar.'); setSaving(false); return }

    const dataMudou = form.event_date !== initial.event_date || form.event_time !== initial.event_time
    if (dataMudou) {
      if (dateChangesCount === 0) setDateChangesCount(1)
      setDateStage('idle')
    }

    setInitial(form)
    setMsg('Salvo!')
    setSaving(false)
  }

  const whatsappTxt = `Você está convidado para "${form.title}"! Confirme sua presença: ${linkConvite}`

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">

        {/* Header — padrão */}
        <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1 mb-8">
          <div className="flex items-center justify-between md:contents">
            <a href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-[43px] md:h-[47px] w-auto" />
            </a>
            <div className="flex items-center gap-1 md:hidden">
              <ProfilePopover userName={userName} userAvatar={userAvatar} userCredits={creditsLeft} />
            </div>
          </div>

          <div className="flex items-center gap-x-2 flex-wrap md:flex-1 min-w-0">
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <a href="/meus-convites" className="text-gray-400 hover:text-gray-600 text-sm whitespace-nowrap">Meus convites</a>
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <span className="text-brand font-bold text-[25px] truncate">{evento.title}</span>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <ProfilePopover userName={userName} userAvatar={userAvatar} userCredits={creditsLeft} />
          </div>
        </div>

        {isNovo && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-700 font-bold text-sm">🎉 Convite criado com sucesso!</p>
          </div>
        )}

        {/* Status rápido — contadores + compartilhar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm flex flex-col justify-center">
              <p className="text-2xl font-extrabold text-brand">{rsvps.length}</p>
              <p className="text-gray-500 text-xs mt-1">Total</p>
              {rsvps.length > 0 && (
                unlocked ? (
                  <a href={`/dashboard/${evento.edit_token}/convidados`} className="text-[10px] font-semibold text-brand mt-1">
                    Ver quem vai
                  </a>
                ) : isOwner ? (
                  <button
                    onClick={desbloquear}
                    disabled={unlocking}
                    className="text-[10px] font-semibold text-brand mt-1 disabled:opacity-50"
                  >
                    🔒 {unlocking ? 'Desbloqueando…' : `Desbloquear (${UNLOCK_COST} créditos)`}
                  </button>
                ) : null
              )}
            </div>
            {[
              { label: 'Nível 1',  count: nivel1.length },
              { label: 'Nível 2+', count: nivel2.length + nivel3.length },
            ].map(c => (
              <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm flex flex-col justify-center">
                <p className="text-2xl font-extrabold text-brand">{c.count}</p>
                <p className="text-gray-500 text-xs mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
            {isPast ? (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Convite encerrado</p>
                <p className="text-gray-500 text-sm">Esse evento já aconteceu em {fmtDate(evento.event_date)} — não é mais possível compartilhar ou editar.</p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Link do convite</p>
                <div className="flex gap-2">
                  <input
                    readOnly value={linkConvite}
                    className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono outline-none"
                  />
                  <button
                    onClick={() => copiar(linkConvite)}
                    className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wide"
                  >
                    {copiado ? '✓' : 'Copiar'}
                  </button>
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappTxt)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#25D366] text-white font-bold text-sm"
                >
                  Compartilhar no WhatsApp
                </a>
              </>
            )}
          </div>
        </div>

        {unlockErro && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-red-600 text-sm">{unlockErro}</p>
            {unlockErro.includes('insuficientes') && (
              <a href="/creditos" className="text-xs font-bold text-brand hover:text-brand-dark whitespace-nowrap">
                Comprar créditos →
              </a>
            )}
          </div>
        )}

        {/* Edição completa — mesma estrutura do /criar (eventos futuros); eventos
            passados mostram só o preview mascarado, sem editar nem compartilhar */}
        {isPast ? (
          <div className="mb-12 max-w-sm">
            <div className="relative">
              <EventPreviewCard form={initial} userName={userName} userAvatar={userAvatar} userBio={userBio} userInstagram={userInstagram} />
              <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] rounded-lg flex items-center justify-center p-6">
                <p className="text-center text-gray-600 font-bold text-sm">Esse evento já aconteceu.</p>
              </div>
            </div>
          </div>
        ) : !editando ? (
          <div className="mb-12">
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 hover:border-brand hover:bg-brand/5 text-gray-700 font-semibold text-sm uppercase tracking-wide transition-colors"
            >
              Editar convite
              <EditIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Editar convite</p>
              <button onClick={() => setEditando(false)} className="text-xs font-bold text-brand hover:text-brand-dark uppercase tracking-wide">
                Fechar ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nome do evento *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Churrasco de Sábado"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
              />
            </div>

            {dateChangesCount === 0 || dateStage === 'unlocked' ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Data *</label>
                    <DatePicker value={form.event_date} onChange={v => set('event_date', v)} />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Horário *</label>
                    <TimePicker value={form.event_time} onChange={v => set('event_time', v)} />
                  </div>
                </div>
                {dateChangesCount === 0 && (
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Você pode alterar a data 1 vez de graça — depois disso, cada troca custa {DATE_UNLOCK_COST} créditos.
                  </p>
                )}
              </div>
            ) : dateStage === 'confirm' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Data e horário</label>
                <CreditLockPanel
                  title={`Trocar a data custa ${DATE_UNLOCK_COST} créditos`}
                  message={`Vai debitar ${DATE_UNLOCK_COST} créditos do seu saldo (${creditsLeft} disponíveis) assim que você confirmar.`}
                  credits={creditsLeft}
                  cost={DATE_UNLOCK_COST}
                  onCancel={() => setDateStage('idle')}
                  onContinue={desbloquearData}
                  continuing={dateUnlocking}
                  erro={dateErro}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Data e horário</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                  <p className="text-sm text-gray-500">{fmtDataHora(form.event_date, form.event_time)}</p>
                  <button
                    type="button"
                    onClick={() => setDateStage('confirm')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-brand text-xs font-semibold uppercase tracking-wide text-gray-700 transition-colors"
                  >
                    🔒 Alterar data ({DATE_UNLOCK_COST} créditos)
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Local</label>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="Endereço ou nome do lugar"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Link externo</label>
              <input
                value={form.external_url}
                onChange={e => set('external_url', e.target.value)}
                placeholder="https://...(ingresso, mais informações, etc...)"
                type="url"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
            </div>

            {form.external_url && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Texto do botão</label>
                <input
                  value={form.external_url_label}
                  onChange={e => set('external_url_label', e.target.value)}
                  placeholder="Ex: Comprar ingresso 🎟️"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                />
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Foto, nome, bio e @Instagram da sua assinatura se editam direto no
                seu perfil. Acesse: <GridIcon className="inline-block w-3.5 h-3.5 align-[-2px] mx-0.5" /> menu » Editar perfil.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Comentários</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Personalize a mensagem com um convite especial para quem está recebendo."
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quem pode convidar?</label>
              <div className="grid grid-cols-3 gap-2">
                {PRIVACIDADE.map(p => (
                  <button
                    key={p.value}
                    onClick={() => set('max_depth', p.value)}
                    className={`rounded-xl p-3 text-left border transition-colors ${
                      form.max_depth === p.value
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-900">{p.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:hidden">
              <BgSelector
                value={form.bg_image_url}
                onChange={v => set('bg_image_url', v)}
                title={form.title}
                editToken={evento.edit_token}
                credits={creditsLeft}
                onUploaded={onHeaderImageUploaded}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Vídeo do convite</label>
              {videoStage === 'unlocked' && (
                <>
                  <input
                    value={form.video_url}
                    onChange={e => set('video_url', e.target.value)}
                    placeholder="Cole o link do vídeo do YouTube/Vimeo"
                    type="url"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Aparece abaixo do botão BORA na página do convite</p>
                </>
              )}
              {videoStage === 'confirm' && (
                <CreditLockPanel
                  title={evento.video_url ? 'Trocar o vídeo custa 1 crédito' : 'Adicionar vídeo custa 1 crédito'}
                  message={`Vai debitar 1 crédito do seu saldo (${creditsLeft} disponíveis) assim que você confirmar.`}
                  credits={creditsLeft}
                  onCancel={() => setVideoStage('idle')}
                  onContinue={desbloquearVideo}
                  continuing={videoUnlocking}
                  erro={videoErro}
                />
              )}
              {videoStage === 'idle' && (
                evento.video_url ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    <p className="text-sm text-gray-500 truncate">{evento.video_url}</p>
                    <button
                      type="button"
                      onClick={() => setVideoStage('confirm')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-brand text-xs font-semibold uppercase tracking-wide text-gray-700 transition-colors"
                    >
                      🔒 Trocar (1 crédito)
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVideoStage('confirm')}
                    className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-300 rounded-xl px-4 py-3 text-amber-700 font-semibold text-sm transition-colors"
                  >
                    🔒 Adicionar vídeo — 1 crédito
                  </button>
                )
              )}
              <p className="text-[10px] text-gray-400 mt-1">Aparece abaixo do botão BORA na página do convite</p>
            </div>

            {msg && (
              <p className={`text-sm ${msg === 'Salvo!' ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
            )}

            <button
              onClick={salvar}
              disabled={saving || !dirty}
              className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-colors ${
                dirty
                  ? 'bg-brand hover:bg-brand-dark text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {saving ? 'Salvando…' : dirty ? 'Salvar alterações' : 'Nada para salvar'}
            </button>
          </div>

          <div className="hidden lg:block">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 text-center">Preview</p>
            <div className="sticky top-6 space-y-3">
              <EventPreviewCard form={form} userName={userName} userAvatar={userAvatar} userBio={userBio} userInstagram={userInstagram} />
              <BgSelector
                value={form.bg_image_url}
                onChange={v => set('bg_image_url', v)}
                title={form.title}
                editToken={evento.edit_token}
                credits={creditsLeft}
                onUploaded={onHeaderImageUploaded}
              />
            </div>
          </div>

        </div>
        )}

        {/* Confirmados */}
        {rsvps.length > 0 && (
          unlocked ? (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Confirmados</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {rsvps.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {r.user_name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{r.user_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      r.depth_level === 1 ? 'bg-blue-50 text-blue-600' :
                      r.depth_level === 2 ? 'bg-pink-50 text-pink-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      Nível {r.depth_level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : isOwner ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-center">
              <p className="text-3xl mb-2">🔒</p>
              <p className="text-gray-700 text-sm font-semibold">{rsvps.length} confirmados</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">Desbloqueie os nomes por {UNLOCK_COST} créditos — vale pra sempre nesse convite.</p>
              <button
                onClick={desbloquear}
                disabled={unlocking}
                className="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wide transition-colors"
              >
                {unlocking ? 'Desbloqueando…' : `Desbloquear (${UNLOCK_COST} créditos)`}
              </button>
            </div>
          ) : null
        )}

      </div>

      <AppFooter />
    </div>
  )
}
