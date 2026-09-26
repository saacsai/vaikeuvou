'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TIPOS = [
  { value: 'VaikeuFui',   label: '#VaikeuFui',   desc: 'Resenha em primeira pessoa — só lugar onde foi e gostou' },
  { value: 'Tendeu',      label: '#Tendeu',      desc: 'Tutorial — responde uma dúvida específica' },
  { value: 'ProntoFalei', label: '#ProntoFalei', desc: 'Opinião — constrói a tese "quem vai importa mais que onde"' },
]

export default function PautaForm() {
  const router = useRouter()
  const [tipo,           setTipo]           = useState('VaikeuFui')
  const [titulo,         setTitulo]         = useState('')
  const [ideiasCentrais, setIdeiasCentrais] = useState('')
  const [saving,         setSaving]         = useState(false)
  const [erro,           setErro]           = useState('')
  const [ok,             setOk]             = useState(false)

  async function salvar() {
    if (!titulo.trim() || !ideiasCentrais.trim()) {
      setErro('Preencha título e ideias centrais.')
      return
    }
    setSaving(true)
    setErro('')
    setOk(false)

    const res = await fetch('/api/admin/pautas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, titulo, ideias_centrais: ideiasCentrais }),
    })
    const json = await res.json()

    if (!res.ok) { setErro(json.error ?? 'Erro ao salvar.'); setSaving(false); return }

    setTitulo('')
    setIdeiasCentrais('')
    setOk(true)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <p className="text-sm font-bold text-gray-900">Nova pauta</p>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Tipo</label>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value)}
              className={`rounded-xl p-3 text-left border transition-colors ${
                tipo === t.value ? 'border-brand bg-brand/5' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-xs font-bold text-gray-900">{t.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Título</label>
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Ex: Trilha da Pedra Grande em Atibaia"
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Ideias centrais</label>
        <textarea
          value={ideiasCentrais}
          onChange={e => setIdeiasCentrais(e.target.value)}
          placeholder="O cerne do que você viveu/pensa — o que só você sabe e a IA não pode inventar. Pode ser bagunçado, tópicos soltos, sem formatação."
          rows={5}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
        />
      </div>

      {erro && <p className="text-xs text-red-500">{erro}</p>}
      {ok && <p className="text-xs text-green-600">Pauta salva — entra na fila como pendente.</p>}

      <button
        type="button"
        onClick={salvar}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wide"
      >
        {saving ? 'Salvando…' : 'Adicionar à fila'}
      </button>
    </div>
  )
}
