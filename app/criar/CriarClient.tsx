'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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

type Form = EventFormFields

type Props = {
  userName: string | null
  userAvatar: string | null
  userBio: string | null
  userInstagram: string | null
}

export default function CriarClient({ userName, userAvatar, userBio, userInstagram }: Props) {
  const perfilIncompleto = !userAvatar || !userBio || !userInstagram
  const router = useRouter()
  const [form, setForm] = useState<Form>({
    title: '', event_date: '', event_time: '',
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
    if (!form.title || !form.event_date || !form.event_time) {
      setErro('Preencha pelo menos o título, a data e o horário.')
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

    if (!res.ok) { setErro(json.error ?? 'Erro ao criar convite.'); setSaving(false); return }
    router.push(`/dashboard/${json.edit_token}?novo=1`)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">

        <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1 mb-8">
          <div className="flex items-center justify-between md:contents">
            <a href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-[43px] md:h-[47px] w-auto" />
            </a>
            <div className="flex items-center gap-1 md:hidden">
              <ProfilePopover userName={userName} userAvatar={userAvatar} />
            </div>
          </div>

          <div className="flex items-center gap-x-2 flex-wrap md:flex-1">
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <a href="/meus-convites" className="text-gray-400 hover:text-gray-600 text-sm whitespace-nowrap">Meus convites</a>
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <span className="text-brand font-bold text-[25px] whitespace-nowrap">Criar convite</span>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <ProfilePopover userName={userName} userAvatar={userAvatar} />
          </div>
        </div>

        {perfilIncompleto && (
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-brand">Capriche na sua assinatura!</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Foto, bio e @ aparecem no seu convite — sem foto, por exemplo,
                fica sem graça assinar só com as iniciais.
              </p>
            </div>
            <a href="/perfil" className="text-xs font-bold text-brand hover:text-brand-dark whitespace-nowrap">
              Completar perfil →
            </a>
          </div>
        )}

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

            {/* Vídeo */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Vídeo do convite
              </label>
              <input
                value={form.video_url}
                onChange={e => set('video_url', e.target.value)}
                placeholder="YouTube ou Vimeo"
                type="url"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">Aparece abaixo do botão BORA na página do convite</p>
            </div>

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            <button
              onClick={criar}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-lg uppercase tracking-wide transition-colors"
            >
              {saving ? 'Criando…' : 'Criar convite'}
            </button>
          </div>

          {/* Preview — desktop only */}
          <div className="hidden lg:block">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 text-center">Preview</p>
            <div className="sticky top-6 space-y-3">
              <EventPreviewCard form={form} userName={userName} userAvatar={userAvatar} userBio={userBio} userInstagram={userInstagram} />
              <BgSelector value={form.bg_image_url} onChange={v => set('bg_image_url', v)} title={form.title} />
            </div>
          </div>

        </div>
      </div>

      <AppFooter />
    </div>
  )
}
