'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerificarForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const phone   = params.get('p') ?? ''

  const [code,   setCode]   = useState('')
  const [saving, setSaving] = useState(false)
  const [erro,   setErro]   = useState('')
  const [reenvio, setReenvio] = useState(false)

  useEffect(() => {
    if (!phone) router.replace('/login')
  }, [phone, router])

  async function verificar() {
    if (code.length < 6) { setErro('Digite o código de 6 dígitos.'); return }
    setSaving(true)
    setErro('')

    const res = await fetch('/api/auth/verificar-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })
    const json = await res.json()

    if (!res.ok) { setErro(json.error ?? 'Código inválido.'); setSaving(false); return }

    router.push('/meus-eventos')
  }

  async function reenviar() {
    setReenvio(true)
    setErro('')
    const res = await fetch('/api/auth/enviar-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const json = await res.json()
    if (!res.ok) setErro(json.error ?? 'Erro ao reenviar.')
    setReenvio(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-violet-400 font-bold text-sm uppercase tracking-widest mb-2">vaikeuvou.app</p>
          <h1 className="text-2xl font-extrabold">Código enviado!</h1>
          <p className="text-gray-400 text-sm mt-1">
            Enviamos um código para<br />
            <span className="text-white font-semibold">{phone}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Código de 6 dígitos
            </label>
            <input
              type="number"
              value={code}
              onChange={e => setCode(e.target.value.slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verificar()}
              placeholder="000000"
              autoFocus
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-2xl font-mono tracking-widest text-center"
            />
          </div>

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <button
            onClick={verificar}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-extrabold text-lg transition-colors"
          >
            {saving ? 'Verificando…' : 'Entrar ✓'}
          </button>

          <button
            onClick={reenviar}
            disabled={reenvio}
            className="w-full text-gray-500 text-sm py-2 hover:text-gray-400 disabled:opacity-50"
          >
            {reenvio ? 'Reenviando…' : 'Reenviar código'}
          </button>
        </div>

        <div className="text-center">
          <a href="/login" className="text-gray-500 text-sm hover:text-gray-400">← Trocar número</a>
        </div>
      </div>
    </div>
  )
}

export default function VerificarPage() {
  return (
    <Suspense>
      <VerificarForm />
    </Suspense>
  )
}
