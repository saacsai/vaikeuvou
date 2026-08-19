'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import CreditLockPanel from '@/components/CreditLockPanel'

const COST = 3

type Props = {
  /** Presente no painel (convite já existe) — ausente em /criar. */
  editToken?: string
  title: string
  credits: number
  hasAvatar?: boolean
  onUploaded: (url: string, cost?: number) => void
}

type Stage = 'idle' | 'confirm' | 'prompt' | 'preview'
type RefMode = 'none' | 'avatar' | 'upload'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AiImageGenerate({ editToken, title, credits, hasAvatar, onUploaded }: Props) {
  const [stage,         setStage]         = useState<Stage>('idle')
  const [prompt,        setPrompt]        = useState('')
  const [refMode,       setRefMode]       = useState<RefMode>('none')
  const [refFile,       setRefFile]       = useState<File | null>(null)
  const [refPreview,    setRefPreview]    = useState('')
  const [generating,    setGenerating]    = useState(false)
  const [resolving,     setResolving]     = useState(false)
  const [msg,           setMsg]           = useState('')
  const [previewUrl,    setPreviewUrl]    = useState('')
  const [generationId,  setGenerationId]  = useState('')

  function onRefFile(file: File | null) {
    setRefFile(file)
    setRefPreview(file ? URL.createObjectURL(file) : '')
  }

  // Se uma geração anterior ficou pendente (a pessoa saiu da tela achando
  // que tinha travado, mas a geração terminou depois — já cobrou o
  // crédito), recupera ela aqui em vez de deixar sumir sem forma de
  // aprovar/recusar.
  useEffect(() => {
    const qs = editToken ? `?edit_token=${editToken}` : ''
    fetch(`/api/eventos/imagem-ia/pendente${qs}`)
      .then(r => r.json())
      .then(json => {
        if (json.pending) {
          setPreviewUrl(json.pending.url)
          setGenerationId(json.pending.generationId)
          setStage('preview')
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function gerar() {
    if (refMode === 'upload') {
      if (!refFile) { setMsg('Escolha uma foto pra transformar.'); return }
    } else if (!prompt.trim()) {
      setMsg('Descreva o clima do seu evento.')
      return
    }
    setGenerating(true)
    setMsg('')

    const referenceImage = refMode === 'upload' && refFile ? await fileToDataUrl(refFile) : undefined

    const res  = await fetch('/api/eventos/imagem-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edit_token: editToken, title, prompt,
        includeAvatar: refMode === 'avatar',
        referenceImage,
      }),
    })
    const json = await res.json()

    if (res.ok) {
      setPreviewUrl(json.url)
      setGenerationId(json.generationId)
      setStage('preview')
    } else {
      setMsg(json.error ?? 'Erro ao gerar imagem.')
    }
    setGenerating(false)
  }

  async function aprovar() {
    setResolving(true)
    setMsg('')
    // No painel, o convite já existe — grava a capa de verdade na hora.
    // Em /criar não tem o que gravar ainda; o próprio onUploaded já guarda
    // a URL no formulário, que vai junto quando o convite for criado.
    if (editToken) {
      const res  = await fetch('/api/eventos/imagem-ia/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_token: editToken, generation_id: generationId }),
      })
      const json = await res.json()
      if (!res.ok) { setMsg(json.error ?? 'Erro ao aprovar.'); setResolving(false); return }
    }
    onUploaded(previewUrl, COST)
    setStage('idle')
    setPrompt('')
    setRefMode('none')
    onRefFile(null)
    setPreviewUrl('')
    setGenerationId('')
    setResolving(false)
  }

  async function recusar() {
    setResolving(true)
    setMsg('')
    const res  = await fetch('/api/eventos/imagem-ia/recusar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generation_id: generationId }),
    })
    const json = await res.json()
    setResolving(false)
    if (!res.ok) { setMsg(json.error ?? 'Erro ao recusar.'); return }
    setPreviewUrl('')
    setGenerationId('')
    setStage('prompt')
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
        message={`Vai debitar 3 créditos do seu saldo (${credits} disponíveis). Se não aprovar o resultado, devolvemos na hora.`}
        credits={credits}
        cost={COST}
        onCancel={() => setStage('idle')}
        onContinue={() => setStage('prompt')}
        continueLabel="Continuar"
      />
    )
  }

  if (stage === 'preview') {
    return (
      <div className="col-span-4 space-y-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
        <p className="text-xs font-semibold text-gray-700">Curtiu essa imagem?</p>
        <div className="relative w-full aspect-[2.4/1] rounded-lg overflow-hidden border border-amber-300 bg-white">
          <Image src={previewUrl} alt="Prévia gerada por IA" fill unoptimized className="object-cover" />
        </div>
        {msg && <p className="text-xs text-red-500">{msg}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={recusar}
            disabled={resolving}
            className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wide hover:bg-gray-50 disabled:opacity-50"
          >
            {resolving ? 'Aguarde…' : 'Gerar de novo'}
          </button>
          <button
            type="button"
            onClick={aprovar}
            disabled={resolving}
            className="flex-1 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide"
          >
            {resolving ? 'Aguarde…' : 'Usar essa imagem'}
          </button>
        </div>
        <p className="text-[10px] text-gray-400">Recusar devolve os 3 créditos dessa tentativa — gerar de novo cobra outra vez.</p>
      </div>
    )
  }

  return (
    <div className="col-span-4 space-y-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-700">Foto de referência</p>
        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="radio"
            name="refMode"
            checked={refMode === 'none'}
            onChange={() => { setRefMode('none'); onRefFile(null) }}
            disabled={generating}
            className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 accent-brand"
          />
          <span>Nenhuma — a IA inventa a cena a partir da descrição</span>
        </label>
        {hasAvatar && (
          <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="radio"
              name="refMode"
              checked={refMode === 'avatar'}
              onChange={() => { setRefMode('avatar'); onRefFile(null) }}
              disabled={generating}
              className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 accent-brand"
            />
            <span>Minha foto de perfil (vira uma ilustração parecida comigo, na cena descrita)</span>
          </label>
        )}
        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="radio"
            name="refMode"
            checked={refMode === 'upload'}
            onChange={() => setRefMode('upload')}
            disabled={generating}
            className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 accent-brand"
          />
          <span>Enviar uma foto (do local, do grupo etc.) — transforma ela numa pintura</span>
        </label>
        {refMode === 'upload' && (
          <div className="pl-6 flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={e => onRefFile(e.target.files?.[0] ?? null)}
              disabled={generating}
              className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-700 file:text-xs file:font-semibold"
            />
            {refPreview && (
              <div className="relative w-10 h-10 rounded-md overflow-hidden border border-amber-300 flex-shrink-0">
                <Image src={refPreview} alt="Foto enviada" fill unoptimized className="object-cover" />
              </div>
            )}
          </div>
        )}
      </div>

      {refMode === 'upload' ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-700">Instrução extra (opcional)</p>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ex: adicione uma faixa de festa, deixe o clima mais noturno..."
            rows={2}
            disabled={generating}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-700">Descreva o clima do seu evento</p>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ex: churrasco de fim de tarde na laje, galera reunida, luz dourada do pôr do sol"
            rows={3}
            disabled={generating}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
          />
        </div>
      )}

      {msg && <p className="text-xs text-red-500">{msg}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setStage('idle'); setPrompt(''); setRefMode('none'); onRefFile(null); setMsg('') }}
          disabled={generating}
          className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wide hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={gerar}
          disabled={generating}
          className="flex-1 py-2 px-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide leading-tight"
        >
          {generating
            ? 'Gerando… (~25s)'
            : refMode === 'upload' ? `Transformar (${COST} créditos)` : `Gerar (${COST} créditos)`}
        </button>
      </div>
    </div>
  )
}
