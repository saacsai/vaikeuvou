'use client'

import { useState } from 'react'

const ASSUNTOS = ['Dúvidas/sugestões', 'Reclamações', 'Cancelamento de conta', 'Parcerias', 'Outros']

type Props = {
  userName: string | null
  userEmail: string | null
}

export default function FaleClient({ userName, userEmail }: Props) {
  const [name,    setName]    = useState(userName ?? '')
  const [email,   setEmail]   = useState(userEmail ?? '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [erro,    setErro]    = useState('')
  const [enviado, setEnviado] = useState(false)

  async function enviar() {
    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setErro('Preencha todos os campos.')
      return
    }
    setSaving(true)
    setErro('')

    const res = await fetch('/api/fale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    })
    const json = await res.json()

    if (!res.ok) { setErro(json.error ?? 'Erro ao enviar.'); setSaving(false); return }

    setEnviado(true)
    setSaving(false)
  }

  if (enviado) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-green-700 font-bold text-sm">Mensagem enviada!</p>
        <p className="text-green-600 text-xs mt-1">Recebemos e vamos responder o quanto antes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Seu nome</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Como podemos te chamar?"
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Seu e-mail</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Assunto</label>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-brand text-sm"
        >
          <option value="" disabled>Escolha um assunto</option>
          {ASSUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mensagem</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Conta pra gente o que você precisa"
          rows={5}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
        />
      </div>

      {erro && <p className="text-red-500 text-sm">{erro}</p>}

      <button
        onClick={enviar}
        disabled={saving}
        className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-lg uppercase tracking-wide transition-colors"
      >
        {saving ? 'Enviando…' : 'Enviar mensagem'}
      </button>
    </div>
  )
}
