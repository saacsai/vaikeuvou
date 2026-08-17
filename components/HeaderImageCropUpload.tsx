'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

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
  editToken: string
  credits: number
  onUploaded: (url: string) => void
}

export default function HeaderImageCropUpload({ editToken, credits, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [msg,       setMsg]       = useState('')
  const [crop,      setCrop]      = useState<CropState | null>(null)

  const fileRef    = useRef<HTMLInputElement>(null)
  const cropCanvas = useRef<HTMLCanvasElement>(null)

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

  async function confirmarCrop() {
    if (!crop) return
    setUploading(true)
    setMsg('')

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
    if (!blob) { setMsg('Erro ao processar imagem.'); setUploading(false); return }

    const form = new FormData()
    form.append('edit_token', editToken)
    form.append('imagem', blob, 'header.jpg')

    const res  = await fetch('/api/eventos/imagem-cabecalho', { method: 'POST', body: form })
    const json = await res.json()

    if (res.ok) {
      onUploaded(json.url)
      setCrop(null)
    } else {
      setMsg(json.error ?? 'Erro ao enviar imagem.')
    }
    setUploading(false)
  }

  const minScale = crop ? Math.max(DISPLAY_W / crop.naturalW, DISPLAY_H / crop.naturalH) : 1

  if (!crop) {
    return (
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title="Enviar sua própria foto — 1 crédito"
        className="aspect-square rounded-lg bg-gray-50 hover:bg-brand/5 border-2 border-dashed border-gray-300 hover:border-brand flex flex-col items-center justify-center gap-1 transition-colors"
      >
        <CameraIcon className="w-5 h-5 text-gray-400" />
        <span className="text-[8px] font-bold text-gray-600 uppercase leading-tight text-center px-1">Enviar foto</span>
        <span className="text-[7px] font-bold text-brand uppercase">1 crédito</span>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      </button>
    )
  }

  return (
    <div className="col-span-4 space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-xs font-semibold text-gray-700 text-center">Arraste para posicionar — sai sempre 1200×500, sem distorcer</p>

      <div
        className="mx-auto rounded-lg overflow-hidden select-none border-2 border-brand"
        style={{ width: DISPLAY_W, height: DISPLAY_H, position: 'relative', cursor: crop.dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
      </div>

      <input
        type="range"
        min={minScale}
        max={Math.min(minScale * 4, 3)}
        step={0.005}
        value={crop.scale}
        onChange={onZoom}
        className="w-full accent-brand"
      />

      {credits < 1 && (
        <p className="text-xs text-red-500 text-center">
          Você não tem créditos suficientes. <a href="/creditos" className="font-bold hover:underline">Comprar créditos</a>
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCrop(null)}
          className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wide hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirmarCrop}
          disabled={uploading || credits < 1}
          className="flex-1 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide"
        >
          {uploading ? 'Enviando…' : 'Usar (1 crédito)'}
        </button>
      </div>

      {msg && <p className="text-xs text-center text-red-500">{msg}</p>}

      <canvas ref={cropCanvas} className="hidden" />
    </div>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
