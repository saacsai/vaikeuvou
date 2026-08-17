'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import CreditLockPanel from '@/components/CreditLockPanel'

type CropState = {
  src: string
  naturalW: number
  naturalH: number
  x: number
  y: number
  scale: number
  dragging: boolean
  startX: number
  startY: number
}

// Moldura de recorte na tela (mantém a proporção 2.4:1 do banner real do
// card — EventPreviewCard.tsx / EventoClient.tsx). A saída final é sempre
// 1200x500px, então a imagem nunca sai distorcida.
const DISPLAY_W = 320
const DISPLAY_H = Math.round(DISPLAY_W / 2.4)
const OUT_W = 1200
const OUT_H = 500

type Props = {
  /** Presente só no painel — habilita upload imediato (sobe e debita na hora). */
  editToken?: string
  credits: number
  onUploaded?: (url: string) => void
  /** Presente no /criar — o convite ainda não existe, então não dá pra subir
   * de verdade ainda. Só guarda o recorte pronto; o upload de verdade (e a
   * cobrança) acontece só depois que o convite for criado. */
  onCropped?: (blob: Blob, previewUrl: string) => void
}

type Stage = 'idle' | 'confirmTroca' | 'crop'

export default function HeaderImageCropUpload({ editToken, credits, onUploaded, onCropped }: Props) {
  const [stage,     setStage]     = useState<Stage>('idle')
  const [uploading, setUploading] = useState(false)
  const [msg,       setMsg]       = useState('')
  const [crop,      setCrop]      = useState<CropState | null>(null)

  const fileRef    = useRef<HTMLInputElement>(null)
  const cropCanvas = useRef<HTMLCanvasElement>(null)

  function abrirSeletor() {
    if (credits < 1) return
    fileRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const src = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      const minScale = Math.max(DISPLAY_W / img.naturalWidth, DISPLAY_H / img.naturalHeight)
      setCrop({
        src,
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        x: 0, y: 0,
        scale: minScale,
        dragging: false, startX: 0, startY: 0,
      })
      setStage('crop')
    }
    img.src = src
    setMsg('')
    e.target.value = ''
  }

  useEffect(() => {
    return () => { if (crop) URL.revokeObjectURL(crop.src) }
  }, [crop?.src])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setCrop(c => c ? { ...c, dragging: true, startX: e.clientX - c.x, startY: e.clientY - c.y } : c)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    setCrop(c => {
      if (!c?.dragging) return c
      const w    = c.naturalW * c.scale
      const h    = c.naturalH * c.scale
      const newX = Math.min(0, Math.max(DISPLAY_W - w, e.clientX - c.startX))
      const newY = Math.min(0, Math.max(DISPLAY_H - h, e.clientY - c.startY))
      return { ...c, x: newX, y: newY }
    })
  }, [])

  const onPointerUp = useCallback(() => {
    setCrop(c => c ? { ...c, dragging: false } : c)
  }, [])

  function onZoom(e: React.ChangeEvent<HTMLInputElement>) {
    const scale = Number(e.target.value)
    setCrop(c => {
      if (!c) return c
      const w    = c.naturalW * scale
      const h    = c.naturalH * scale
      const newX = Math.min(0, Math.max(DISPLAY_W - w, c.x))
      const newY = Math.min(0, Math.max(DISPLAY_H - h, c.y))
      return { ...c, scale, x: newX, y: newY }
    })
  }

  function cancelar() {
    setCrop(null)
    setStage('idle')
    setMsg('')
  }

  async function confirmarCrop() {
    if (!crop) return
    const canvas = cropCanvas.current!
    canvas.width  = OUT_W
    canvas.height = OUT_H
    const ctx = canvas.getContext('2d')!

    const img = new window.Image()
    img.src = crop.src
    await new Promise(r => { img.complete ? r(null) : (img.onload = r) })

    ctx.drawImage(
      img,
      -crop.x / crop.scale,
      -crop.y / crop.scale,
      DISPLAY_W / crop.scale,
      DISPLAY_H / crop.scale,
      0, 0, OUT_W, OUT_H,
    )

    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.9))
    if (!blob) { setMsg('Erro ao processar imagem.'); return }

    if (onCropped) {
      // /criar — convite ainda não existe, só guarda o recorte pronto. A
      // cobrança de verdade acontece junto com a criação do convite.
      onCropped(blob, URL.createObjectURL(blob))
      cancelar()
      return
    }

    if (!editToken) return

    setUploading(true)
    setMsg('')

    const form = new FormData()
    form.append('edit_token', editToken)
    form.append('imagem', blob, 'header.jpg')

    const res  = await fetch('/api/eventos/imagem-cabecalho', { method: 'POST', body: form })
    const json = await res.json()

    if (res.ok) {
      onUploaded?.(json.url)
      cancelar()
    } else {
      setMsg(json.error ?? 'Erro ao enviar imagem.')
      setUploading(false)
    }
  }

  const minScale = crop ? Math.max(DISPLAY_W / crop.naturalW, DISPLAY_H / crop.naturalH) : 1

  // Estado ocioso: sempre travado — foto própria custa 1 crédito, mesmo a
  // primeira vez (na criação do convite ou depois, editando).
  if (stage === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStage('confirmTroca')}
        title="Enviar sua própria foto — 1 crédito"
        className="aspect-square rounded-lg bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-300 flex flex-col items-center justify-center gap-1 transition-colors"
      >
        <LockIcon className="w-5 h-5 text-amber-500" />
        <span className="text-[8px] font-bold text-gray-600 uppercase leading-tight text-center px-1">Enviar foto</span>
        <span className="text-[7px] font-bold text-amber-600 uppercase">1 crédito</span>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      </button>
    )
  }

  // Aviso de custo — aparece ANTES de abrir o seletor de arquivo, não depois
  // de já ter recortado a foto.
  if (stage === 'confirmTroca') {
    return (
      <CreditLockPanel
        className="col-span-4"
        title="Enviar foto própria custa 1 crédito"
        message={
          editToken
            ? `Vai debitar 1 crédito do seu saldo (${credits} disponíveis) assim que você escolher a foto.`
            : 'Vai debitar 1 crédito do seu saldo quando você criar o convite.'
        }
        credits={credits}
        onCancel={() => setStage('idle')}
        onContinue={() => { setStage('idle'); abrirSeletor() }}
      />
    )
  }

  return (
    <div className="col-span-4 space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-xs font-semibold text-gray-700 text-center">Arraste para posicionar — sai sempre 1200×500, sem distorcer</p>

      <div
        className="mx-auto rounded-lg overflow-hidden select-none border-2 border-brand"
        style={{ width: DISPLAY_W, height: DISPLAY_H, position: 'relative', cursor: crop?.dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {crop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={crop.src}
            alt="crop"
            draggable={false}
            style={{
              position: 'absolute',
              width:    crop.naturalW * crop.scale,
              height:   crop.naturalH * crop.scale,
              maxWidth: 'none',
              left:     crop.x,
              top:      crop.y,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <input
        type="range"
        min={minScale}
        max={Math.min(minScale * 4, 3)}
        step={0.005}
        value={crop?.scale ?? minScale}
        onChange={onZoom}
        className="w-full accent-brand"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={cancelar}
          className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wide hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirmarCrop}
          disabled={uploading}
          className="flex-1 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide"
        >
          {uploading ? 'Enviando…' : editToken ? 'Confirmar (1 crédito)' : 'Usar essa foto'}
        </button>
      </div>

      {msg && <p className="text-xs text-center text-red-500">{msg}</p>}

      <canvas ref={cropCanvas} className="hidden" />
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
