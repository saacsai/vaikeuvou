'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Event, Rsvp } from '@/lib/supabase'
import DatePicker from '@/components/DatePicker'
import TimePicker from '@/components/TimePicker'
import { ProfilePopover } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'
import EventPreviewCard from '@/components/EventPreviewCard'
import BgSelector from '@/components/BgSelector'
import type { EventFormFields } from '@/lib/eventForm'

const PRIVACIDADE = [
  { value: 1,   label: 'Privado',          desc: 'Só você convida' },
  { value: 2,   label: 'Amigos de amigos', desc: 'Quem confirmar pode convidar' },
  { value: 999, label: 'Aberto',           desc: 'Viralização ilimitada' },
]

type Props = {
  evento: Event
  rsvps: Rsvp[]
  isNovo: boolean
  userName: string | null
  userAvatar: string | null
}

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

export default function DashboardClient({ evento, rsvps, isNovo, userName, userAvatar }: Props) {
  const [initial,  setInitial]  = useState<EventFormFields>(() => toForm(evento))
  const [form,     setForm]     = useState<EventFormFields>(() => toForm(evento))
  const [copiado,  setCopiado]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const [editando, setEditando] = useState(false)

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  function set(k: keyof EventFormFields, v: string | number) {
    setForm(p => ({ ...p, [k]: v }))
  }

  const linkConvite = `https://vaikeuvou.app/e/${evento.slug}`

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

    setInitial(form)
    setMsg('Salvo!')
    setSaving(false)
  }

  const whatsappTxt = `Você está convidado para "${form.title}"! Confirme sua presença: ${linkConvite}`

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header — padrão */}
        <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1 mb-8">
          <div className="flex items-center justify-between md:contents">
            <a href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-[43px] md:h-[47px] w-auto" />
            </a>
            <div className="flex items-center gap-1 md:hidden">
              <ProfilePopover userName={userName} userAvatar={userAvatar} />
            </div>
          </div>

          <div className="flex items-center gap-x-2 flex-wrap md:flex-1 min-w-0">
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <a href="/meus-convites" className="text-gray-400 hover:text-gray-600 text-sm whitespace-nowrap">Meus convites</a>
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <span className="text-brand font-bold text-[25px] truncate">{evento.title}</span>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <ProfilePopover userName={userName} userAvatar={userAvatar} />
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
                <a href={`/dashboard/${evento.edit_token}/convidados`} className="text-[10px] font-semibold text-brand mt-1">
                  Ver quem vai
                </a>
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Link do convite</p>
            <div className="flex gap-2">
              <input
                readOnly value={linkConvite}
                className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono outline-none"
              />
              <button
                onClick={() => copiar(linkConvite)}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
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
          </div>
        </div>

        {/* Edição completa — mesma estrutura do /criar */}
        {!editando ? (
          <div className="mb-12">
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 hover:border-brand hover:bg-brand/5 text-gray-700 font-semibold text-sm transition-colors"
            >
              ✏️ Editar convite
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Editar convite</p>
              <button onClick={() => setEditando(false)} className="text-xs font-bold text-brand hover:text-brand-dark">
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
              <BgSelector value={form.bg_image_url} onChange={v => set('bg_image_url', v)} title={form.title} />
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

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Vídeo do convite</label>
              <input
                value={form.video_url}
                onChange={e => set('video_url', e.target.value)}
                placeholder="YouTube ou Vimeo"
                type="url"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">Aparece abaixo do botão BORA na página do convite</p>
            </div>

            {msg && (
              <p className={`text-sm ${msg === 'Salvo!' ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
            )}

            <button
              onClick={salvar}
              disabled={saving || !dirty}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
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
              <EventPreviewCard form={form} userName={userName} userAvatar={userAvatar} />
              <BgSelector value={form.bg_image_url} onChange={v => set('bg_image_url', v)} title={form.title} />
            </div>
          </div>

        </div>
        )}

        {/* Confirmados */}
        {rsvps.length > 0 && (
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
        )}

      </div>

      <AppFooter />
    </div>
  )
}
