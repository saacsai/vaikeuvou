'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DesbloquearButton({ editToken }: { editToken: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')

  async function desbloquear() {
    setLoading(true)
    setErro('')
    const res = await fetch('/api/creditos/desbloquear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edit_token: editToken }),
    })
    const json = await res.json()
    if (!res.ok) { setErro(json.error ?? 'Erro ao desbloquear.'); setLoading(false); return }
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={desbloquear}
        disabled={loading}
        className="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wide transition-colors"
      >
        {loading ? 'Desbloqueando…' : 'Desbloquear (3 créditos)'}
      </button>
      {erro && (
        <p className="text-red-500 text-xs mt-3">
          {erro}
          {erro.includes('insuficientes') && (
            <> — <a href="/creditos" className="text-brand font-bold hover:underline">Comprar créditos</a></>
          )}
        </p>
      )}
    </div>
  )
}
