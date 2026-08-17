'use client'

import { useState } from 'react'
import { CREDIT_PACKAGES } from '@/lib/stripe'

type Props = {
  credits: number
  success: boolean
  canceled: boolean
}

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CreditosClient({ credits, success, canceled }: Props) {
  const [loadingPkg, setLoadingPkg] = useState<number | null>(null)
  const [erro,       setErro]       = useState('')

  async function comprar(pkgCredits: number) {
    setLoadingPkg(pkgCredits)
    setErro('')
    const res  = await fetch('/api/creditos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credits: pkgCredits }),
    })
    const json = await res.json()
    if (!res.ok || !json.url) {
      setErro(json.error ?? 'Erro ao iniciar o pagamento.')
      setLoadingPkg(null)
      return
    }
    window.location.href = json.url
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 font-bold text-sm">Pagamento confirmado!</p>
          <p className="text-green-600 text-xs mt-0.5">Seu saldo pode levar alguns segundos pra atualizar.</p>
        </div>
      )}
      {canceled && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-600 text-sm">Pagamento cancelado — nenhum crédito foi cobrado.</p>
        </div>
      )}

      <div className="bg-brand/5 border border-brand/10 rounded-xl p-5 text-center">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo disponível</p>
        <p className="text-4xl font-extrabold text-brand mt-1">{credits}</p>
        <p className="text-xs text-gray-400 mt-1">créditos</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Comprar créditos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CREDIT_PACKAGES.map(pkg => (
            <div key={pkg.credits} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold text-gray-900">{pkg.credits} créditos</p>
                <p className="text-xs text-gray-400">{fmtBRL(pkg.price_cents / pkg.credits)} / crédito</p>
                <p className="text-sm font-semibold text-gray-600 mt-0.5">{fmtBRL(pkg.price_cents)}</p>
              </div>
              <button
                onClick={() => comprar(pkg.credits)}
                disabled={loadingPkg !== null}
                className="px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wide transition-colors whitespace-nowrap"
              >
                {loadingPkg === pkg.credits ? 'Aguarde…' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

      <p className="text-[10px] text-gray-400 text-center">
        3 créditos desbloqueiam a lista de quem confirmou presença em um convite, pra sempre.
        Veja mais em <a href="/como-funciona" className="text-brand hover:underline">Como funciona?</a>
      </p>
    </div>
  )
}
