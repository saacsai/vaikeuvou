'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PRIVACIDADE = [
  { value: 1,   label: 'Privado',          desc: 'Só você convida' },
  { value: 2,   label: 'Amigos de amigos', desc: 'Quem confirmar pode convidar' },
  { value: 999, label: 'Aberto',           desc: 'Viralização ilimitada' },
]

export default function CriarPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', event_date: '', event_time: '19:00',
    location: '', description: '', creator_phone: '', max_depth: 2,
  })
  const [saving, setSaving]   = useState(false)
  const [erro,   setErro]     = useState('')

  function set(k: string, v: string | number) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function criar() {
    if (!form.title || !form.event_date || !form.creator_phone) {
      setErro('Preencha título, data e seu WhatsApp.')
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Header */}
        <a href="/" className="text-violet-400 font-bold text-lg mb-8 block">vaikeuvou.app</a>
        <h1 className="text-3xl font-extrabold mb-1">Criar evento</h1>
        <p className="text-gray-400 text-sm mb-8">Pronto em segundos. Sem cadastro.</p>

        <div className="space-y-5">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Nome do evento *
            </label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ex: Churrasco de Sábado"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-base"
            />
          </div>

          {/* Data e hora */}
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

          {/* Local */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Local</label>
            <input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="Endereço ou nome do lugar"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm"
            />
          </div>

          {/* Descrição */}
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

          {/* Privacidade */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Quem pode convidar?
            </label>
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

          {/* WhatsApp do criador */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Seu WhatsApp *
            </label>
            <input
              type="tel"
              value={form.creator_phone}
              onChange={e => set('creator_phone', e.target.value)}
              placeholder="11 99999-0000"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Para acessar o painel do seu evento</p>
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
      </div>
    </div>
  )
}
