'use client'

import { useState } from 'react'
import CreditLockPanel from '@/components/CreditLockPanel'

const COST = 3

type Props = {
  editToken: string
  credits: number
  onUploaded: (url: string) => void
}

type Stage = 'idle' | 'confirm' | 'prompt'

export default function AiImageGenerate({ editToken, credits, onUploaded }: Props) {
  const [stage,      setStage]      = useState<Stage>('idle')
  const [prompt,     setPrompt]     = useState('')
  const [generating, setGenerating] = useState(false)
  const [msg,        setMsg]        = useState('')

  async function gerar() {
    if (!prompt.trim()) { setMsg('Descreva o clima do seu evento.'); return }
    setGenerating(true)
    setMsg('')

    const res  = await fetch('/api/eventos/imagem-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edit_token: editToken, prompt }),
    })
    const json = await res.json()

    if (res.ok) {
      onUploaded(json.url)
      setStage('idle')
      setPrompt('')
      setGenerating(false)
    } else {
      setMsg(json.error ?? 'Erro ao gerar imagem.')
      setGenerating(false)
    }
  }

  if (stage === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStage('confirm')}
        title="Gerar imagem com IA — 3 créditos"
        className="aspect-square rounded-lg bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-300 flex flex-col items-center justify-center gap-1 transition-colors"
      >
        <span className="text-base">✨</span>
        <span className="text-[8px] font-bold text-gray-600 uppercase leading-tight text-center px-1">Imagem por IA</span>
        <span className="text-[7px] font-bold text-amber-600 uppercase">3 créditos</span>
      </button>
    )
  }

  if (stage === 'confirm') {
    return (
      <CreditLockPanel
        className="col-span-4"
        title="Gerar imagem por IA custa 3 créditos"
        message={`Vai debitar 3 créditos do seu saldo (${credits} disponíveis) a cada geração — inclusive se gerar de novo depois.`}
        credits={credits}
        cost={COST}
        onCancel={() => setStage('idle')}
        onContinue={() => setStage('prompt')}
        continueLabel="Continuar"
      />
    )
  }

  return (
    <div className="col-span-4 space-y-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
      <p className="text-xs font-semibold text-gray-700">Descreva o clima do seu evento</p>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Ex: churrasco de fim de tarde na laje, galera reunida, luz dourada do pôr do sol"
        rows={3}
        disabled={generating}
        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
      />
      {msg && <p className="text-xs text-red-500">{msg}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setStage('idle'); setPrompt(''); setMsg('') }}
          disabled={generating}
          className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wide hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={gerar}
          disabled={generating}
          className="flex-1 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide"
        >
          {generating ? 'Gerando… (~15s)' : `Gerar (${COST} créditos)`}
        </button>
      </div>
    </div>
  )
}
