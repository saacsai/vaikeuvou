'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { titleToGradient, titleToAccent } from '@/lib/gradient'

const PRIVACIDADE = [
  { value: 1,   label: 'Privado',          desc: 'Só você convida' },
  { value: 2,   label: 'Amigos de amigos', desc: 'Quem confirmar pode convidar' },
  { value: 999, label: 'Aberto',           desc: 'Viralização ilimitada' },
]

type Form = {
  title: string
  event_date: string
  event_time: string
  location: string
  description: string
  max_depth: number
  external_url: string
  external_url_label: string
  video_url: string
}

type Props = {
  userName: string | null
  userAvatar: string | null
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg, hsl(270,65%,18%) 0%, hsl(315,55%,12%) 50%, hsl(0,45%,8%) 100%)'
const DEFAULT_ACCENT   = 'hsl(270, 80%, 75%)'

function fmtPreviewDate(date: string, time: string): string {
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  const obj = new Date(y, m - 1, d)
  const days   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${days[obj.getDay()]}, ${d} ${months[m - 1]}${time ? ` às ${time}` : ''}`
}

function EventoPreview({ form, userName, userAvatar }: { form: Form; userName: string | null; userAvatar: string | null }) {
  const hasTitle  = form.title.trim().length > 0
  const gradient  = hasTitle ? titleToGradient(form.title) : DEFAULT_GRADIENT
  const accent    = hasTitle ? titleToAccent(form.title) : DEFAULT_ACCENT
  const nome      = userName ?? 'Você'
  const iniciais  = nome.slice(0, 2).toUpperCase()
  const dateLabel = fmtPreviewDate(form.event_date, form.event_time)

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/5">
      {/* Hero */}
      <div style={{ background: gradient }} className="px-5 pt-6 pb-8">
        <h1 className={`text-xl font-extrabold leading-tight mb-3 ${hasTitle ? 'text-white' : 'text-white/25'}`}>
          {hasTitle ? form.title : 'Nome do evento'}
        </h1>

        <div className="space-y-1 text-xs mb-5" style={{ color: hasTitle ? accent : 'rgba(255,255,255,0.2)' }}>
          {dateLabel
            ? <p>📅 {dateLabel}</p>
            : <p>📅 Data e horário</p>
          }
          {form.location
            ? <p>📍 {form.location}</p>
            : <p>📍 Local</p>
          }
          {form.description && (
            <p className="text-white/50 mt-2 leading-relaxed">{form.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          {userAvatar ? (
            <Image
              src={userAvatar} alt={nome}
              width={28} height={28}
              className="w-7 h-7 rounded-full object-cover border border-white/20"
              unoptimized
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/20"
              style={{ backgroundColor: hasTitle ? accent : DEFAULT_ACCENT, color: '#111' }}
            >
              {iniciais}
            </div>
          )}
          <div>
            <p className="text-[10px] text-white/40">organizado por</p>
            <p className="text-xs font-semibold text-white">{nome}</p>
          </div>
          <p className="ml-auto text-[10px] font-bold text-white/30 uppercase tracking-widest">vaikeuvou</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 py-5 bg-gray-950 space-y-3">
        <p className="text-white text-center text-sm font-bold">E aí? Vamos? 🎉</p>
        <div
          className="w-full py-3 rounded-2xl text-white font-extrabold text-base text-center select-none"
          style={{ backgroundColor: hasTitle ? titleToAccent(form.title).replace('75%', '45%') : '#4c1d95' }}
        >
          BORA! 🚀
        </div>
        <p className="text-gray-600 text-[10px] text-center">Confirme sua presença em segundos</p>
      </div>
    </div>
  )
}

export default function CriarClient({ userName, userAvatar }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Form>({
    title: '', event_date: '', event_time: '19:00',
    location: '', description: '', max_depth: 2,
    external_url: '', external_url_label: '', video_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [erro,   setErro]   = useState('')

  function set(k: keyof Form, v: string | number) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function criar() {
    if (!form.title || !form.event_date) {
      setErro('Preencha pelo menos o título e a data.')
      return
    }
    setSaving(true)
    setErro('')

    const event_date = `${form.event_date}T${form.event_time}:00-03:00`

    const res = await fetch('/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, event_date }),
    })
    const json = await res.json()

    if (!res.ok) { setErro(json.error ?? 'Erro ao criar evento.'); setSaving(false); return }
    router.push(`/dashboard/${json.edit_token}?novo=1`)
  }

  const gradient = form.title ? titleToGradient(form.title) : DEFAULT_GRADIENT

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">

        <a href="/meus-eventos" className="text-gray-500 text-sm hover:text-gray-400">← Meus eventos</a>
        <h1 className="text-3xl font-extrabold mt-3 mb-1">Criar evento</h1>
        <p className="text-gray-400 text-sm mb-8">Pronto em segundos.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Formulário */}
          <div className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Nome do evento *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Churrasco de Sábado"
                autoFocus
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Data *</label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={e => set('event_date', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Horário</label>
                <input
                  type="time"
                  value={form.event_time}
                  onChange={e => set('event_time', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Local</label>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="Endereço ou nome do lugar"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Detalhes</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="O que rolar, o que levar, dress code…"
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Quem pode convidar?</label>
              <div className="grid grid-cols-3 gap-2">
                {PRIVACIDADE.map(p => (
                  <button
                    key={p.value}
                    onClick={() => set('max_depth', p.value)}
                    className={`rounded-xl p-3 text-left border transition-colors ${
                      form.max_depth === p.value
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{p.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Link externo */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Link externo</label>
              <input
                value={form.external_url}
                onChange={e => set('external_url', e.target.value)}
                placeholder="https://... (ingresso, site, maps…)"
                type="url"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm"
              />
            </div>

            {form.external_url && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Texto do botão</label>
                <input
                  value={form.external_url_label}
                  onChange={e => set('external_url_label', e.target.value)}
                  placeholder="Ex: Comprar ingresso 🎟️"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm"
                />
              </div>
            )}

            {/* Vídeo */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Vídeo do evento
              </label>
              <input
                value={form.video_url}
                onChange={e => set('video_url', e.target.value)}
                placeholder="YouTube ou Vimeo"
                type="url"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm"
              />
              <p className="text-[10px] text-gray-600 mt-1">Aparece abaixo do botão BORA na página do evento</p>
            </div>

            {erro && <p className="text-red-400 text-sm">{erro}</p>}

            <button
              onClick={criar}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-extrabold text-lg transition-colors"
            >
              {saving ? 'Criando…' : 'Criar evento 🎉'}
            </button>
          </div>

          {/* Preview — desktop only */}
          <div className="hidden lg:block">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3 text-center">Preview</p>
            <div className="sticky top-6 space-y-3">
              <EventoPreview form={form} userName={userName} userAvatar={userAvatar} />

              {/* BG selector */}
              <div className="rounded-xl bg-gray-900 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Plano de fundo</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg border-2 border-violet-500 overflow-hidden flex-shrink-0">
                      <div style={{ background: gradient }} className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-white font-semibold">Automático ✓</p>
                      <p className="text-[10px] text-gray-500 truncate">Gerado pelo título</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <div
                      className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex flex-col items-center justify-center gap-0.5 cursor-not-allowed"
                      title="Presets — em breve"
                    >
                      <span className="text-sm">🎨</span>
                      <span className="text-[7px] text-gray-500 font-bold uppercase">PRO</span>
                    </div>
                    <div
                      className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex flex-col items-center justify-center gap-0.5 cursor-not-allowed"
                      title="Upload de arte — em breve"
                    >
                      <span className="text-sm text-gray-500 font-bold">↑</span>
                      <span className="text-[7px] text-gray-500 font-bold uppercase">PRO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
