'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'
import AppFooter from '@/components/AppFooter'

function VerificarForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const phone   = params.get('p') ?? ''
  const next    = params.get('next') ?? ''

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

    // Sem destino explícito (login não veio de um CTA como "Criar convite"):
    // decide pelo estado do usuário — sem convites ainda, o primeiro passo
    // natural é criar um; já tendo, cai na lista.
    router.push(next || (json.hasEvents ? '/meus-convites' : '/criar'))
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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <a href="/" className="inline-block mb-5">
              <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-[43px] w-auto mx-auto" />
            </a>
            <h1 className="text-2xl font-extrabold text-gray-900">Código enviado!</h1>
            <p className="text-gray-400 text-sm mt-1">
              Enviamos um código para<br />
              <span className="text-gray-900 font-semibold">{phone}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Código de 6 dígitos
              </label>
              <input
                type="number"
                value={code}
                onChange={e => setCode(e.target.value.slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verificar()}
                placeholder="000000"
                autoFocus
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-2xl font-mono tracking-widest text-center"
              />
            </div>

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            <button
              onClick={verificar}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-lg transition-colors"
            >
              {saving ? 'Verificando…' : 'Entrar ✓'}
            </button>

            <button
              onClick={reenviar}
              disabled={reenvio}
              className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 disabled:opacity-50"
            >
              {reenvio ? 'Reenviando…' : 'Reenviar código'}
            </button>
          </div>

          <div className="text-center">
            <a href="/login" className="text-gray-400 text-sm hover:text-gray-600">← Trocar número</a>
          </div>
        </div>
      </div>

      <AppFooter />
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
