'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router  = useRouter()
  const [phone, setPhone]   = useState('')
  const [saving, setSaving] = useState(false)
  const [erro,   setErro]   = useState('')

  async function enviar() {
    if (!phone.trim()) { setErro('Informe seu WhatsApp.'); return }
    setSaving(true)
    setErro('')

    const res = await fetch('/api/auth/enviar-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const json = await res.json()

    if (!res.ok) { setErro(json.error ?? 'Erro ao enviar.'); setSaving(false); return }

    router.push(`/login/verificar?p=${encodeURIComponent(phone)}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-violet-400 font-bold text-sm uppercase tracking-widest mb-2">vaikeuvou.app</p>
          <h1 className="text-2xl font-extrabold">Entrar</h1>
          <p className="text-gray-400 text-sm mt-1">Vamos te enviar um código no WhatsApp</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Seu WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              placeholder="11 99999-0000"
              autoFocus
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-base"
            />
          </div>

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <button
            onClick={enviar}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-extrabold text-lg transition-colors"
          >
            {saving ? 'Enviando…' : 'Enviar código 📲'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600">
          Não tem conta? O código vai criar uma automaticamente.
        </p>

        <div className="text-center">
          <a href="/" className="text-gray-500 text-sm hover:text-gray-400">← Voltar ao início</a>
        </div>
      </div>
    </div>
  )
}
