'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HEADER_PRESETS, titleToHeader } from '@/lib/headers'

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
  bg_image_url: string
}

type Props = {
  userName: string | null
  userAvatar: string | null
}

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
  const header    = form.bg_image_url
    ? { src: form.bg_image_url, bg: '#f5f5f4' }
    : titleToHeader(hasTitle ? form.title : 'vaikeuvou')
  const nome      = userName ?? 'Você'
  const iniciais  = nome.slice(0, 2).toUpperCase()
  const dateLabel = fmtPreviewDate(form.event_date, form.event_time)

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-100">
      <div className="relative w-full aspect-[2.4/1]">
        <Image src={header.src} alt="" fill unoptimized className="object-cover" />
      </div>

      <div className="px-5 pt-5 pb-6 bg-gradient-to-b from-white to-[#fcede1]">
        <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-7 w-auto mb-0.5" />
        <h1 className={`text-xl font-bold leading-tight mb-3 ${hasTitle ? 'text-gray-900' : 'text-gray-300'}`}>
          {hasTitle ? form.title : 'Nome do evento'}
        </h1>

        <div className="space-y-1 text-xs text-gray-500 mb-4">
          <p>📅 {dateLabel || 'Data e horário'}</p>
          <p>📍 {form.location || 'Local'}</p>
          {form.description && (
            <p className="text-gray-500 mt-2 leading-relaxed italic">&ldquo;{form.description}&rdquo;</p>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          {userAvatar ? (
            <Image src={userAvatar} alt={nome} width={28} height={28}
              className="w-7 h-7 rounded-full object-cover" unoptimized />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
              {iniciais}
            </div>
          )}
          <p className="text-xs text-gray-400">organizado por <span className="font-semibold text-gray-600">{nome}</span></p>
        </div>

        <p className="text-gray-900 font-semibold text-sm mb-2">Vamo aí?</p>
        <div className="w-full py-3 rounded-lg bg-brand select-none flex items-center justify-center gap-[5px]">
          <Image src="/letra_bora.png" alt="BORA" width={130} height={53} className="h-5 w-auto" />
          <Image src="/icone_bora.png" alt="" width={57} height={61} className="h-6 w-auto" />
        </div>
      </div>
    </div>
  )
}

function BgSelector({ value, onChange, title }: { value: string; onChange: (v: string) => void; title: string }) {
  const auto = titleToHeader(title.trim() || 'vaikeuvou')
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Imagem do cabeçalho</p>
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onChange('')}
          title="Automático — escolhido a partir do título"
          className={`relative aspect-square rounded-lg overflow-hidden border-2 ${value === '' ? 'border-brand' : 'border-transparent'}`}
        >
          <Image src={auto.src} alt="Automático" fill unoptimized className="object-cover" />
          <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[9px] font-bold uppercase">
            Auto ✓
          </span>
        </button>
        {HEADER_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => onChange(p.src)}
            title={p.label}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 ${value === p.src ? 'border-brand' : 'border-transparent hover:border-gray-200'}`}
          >
            <Image src={p.src} alt={p.label} fill unoptimized className="object-cover" />
          </button>
        ))}
        <div
          title="Upload de imagem própria — plano PRO"
          className="aspect-square rounded-lg bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-0.5 cursor-not-allowed"
        >
          <span className="text-sm text-gray-400 font-bold">↑</span>
          <span className="text-[7px] text-gray-400 font-bold uppercase">PRO</span>
        </div>
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
    bg_image_url: '',
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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm mb-6">
          <a href="/" className="flex-shrink-0">
            <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-8 md:h-[52px] w-auto" />
          </a>
          <span className="text-gray-300 whitespace-nowrap">»</span>
          <a href="/meus-eventos" className="text-gray-400 hover:text-gray-600 whitespace-nowrap">Meus eventos</a>
          <span className="text-gray-300 whitespace-nowrap">»</span>
          <span className="text-brand font-semibold whitespace-nowrap">Criar convite</span>
        </div>
        <h1 className="text-3xl font-bold mb-1 text-gray-900">Criar convite</h1>
        <p className="text-gray-400 text-sm mb-8">Pronto em segundos.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Formulário */}
          <div className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nome do evento *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Churrasco de Sábado"
                autoFocus
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Data *</label>
                <div className="relative h-[46px] w-full">
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={e => set('event_date', e.target.value)}
                    className="absolute inset-0 w-full h-full bg-white border border-gray-300 rounded-xl px-4 text-gray-900 outline-none focus:border-brand text-sm"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Horário</label>
                <div className="relative h-[46px] w-full">
                  <input
                    type="time"
                    value={form.event_time}
                    onChange={e => set('event_time', e.target.value)}
                    className="absolute inset-0 w-full h-full bg-white border border-gray-300 rounded-xl px-4 text-gray-900 outline-none focus:border-brand text-sm"
                  />
                </div>
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
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Detalhes</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="O que rolar, o que levar, dress code…"
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

            {/* BG selector — mobile (some antes do botão, no desktop fica junto ao preview) */}
            <div className="lg:hidden">
              <BgSelector value={form.bg_image_url} onChange={v => set('bg_image_url', v)} title={form.title} />
            </div>

            {/* Link externo */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Link externo</label>
              <input
                value={form.external_url}
                onChange={e => set('external_url', e.target.value)}
                placeholder="https://... (ingresso, site, maps…)"
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

            {/* Vídeo */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Vídeo do evento
              </label>
              <input
                value={form.video_url}
                onChange={e => set('video_url', e.target.value)}
                placeholder="YouTube ou Vimeo"
                type="url"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">Aparece abaixo do botão BORA na página do evento</p>
            </div>

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            <button
              onClick={criar}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-lg transition-colors"
            >
              {saving ? 'Criando…' : 'Criar convite'}
            </button>
          </div>

          {/* Preview — desktop only */}
          <div className="hidden lg:block">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 text-center">Preview</p>
            <div className="sticky top-6 space-y-3">
              <EventoPreview form={form} userName={userName} userAvatar={userAvatar} />
              <BgSelector value={form.bg_image_url} onChange={v => set('bg_image_url', v)} title={form.title} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
