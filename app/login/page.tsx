'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import AppFooter from '@/components/AppFooter'

function LoginForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const next    = params.get('next') ?? ''
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

    const nextParam = next ? `&next=${encodeURIComponent(next)}` : ''
    router.push(`/login/verificar?p=${encodeURIComponent(phone)}${nextParam}`)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <a href="/" className="inline-block mb-5">
              <Image src="/logo.png" alt="vaikeuvou" width={1161} height={201} className="h-[43px] w-auto mx-auto" />
            </a>
            <h1 className="text-2xl font-extrabold text-gray-900">Entrar</h1>
            <p className="text-gray-400 text-sm mt-1">Vamos te enviar um código no WhatsApp</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Seu WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviar()}
                placeholder="11 99999-0000"
                autoFocus
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
              />
            </div>

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            <button
              onClick={enviar}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-lg uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
            >
              {saving ? 'Enviando…' : (
                <>
                  Enviar código
                  <SendIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">
            Não tem conta? O código vai criar uma automaticamente. Ao continuar, você
            concorda com os{' '}
            <a href="/termos" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Termos de Uso</a>
            {' '}e a{' '}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Política de Privacidade</a>.
          </p>

          <div className="text-center">
            <a href="/" className="text-gray-400 text-sm hover:text-gray-600">← Voltar ao início</a>
          </div>
        </div>
      </div>

      <AppFooter />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
