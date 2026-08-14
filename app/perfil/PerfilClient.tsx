'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'

type Props = {
  userId: string
  phone: string
  name: string | null
  avatarUrl: string | null
}

type CropState = {
  src: string
  x: number       // offset X aplicado à imagem (px)
  y: number       // offset Y aplicado à imagem (px)
  scale: number   // zoom da imagem
  dragging: boolean
  startX: number
  startY: number
}

const CROP_SIZE = 256 // quadrado do preview

export default function PerfilClient({ userId, phone, name: initialName, avatarUrl: initialAvatar }: Props) {
  const [name,      setName]      = useState(initialName ?? '')
  const [avatar,    setAvatar]    = useState(initialAvatar)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg,       setMsg]       = useState('')
  const [crop,      setCrop]      = useState<CropState | null>(null)

  const fileRef    = useRef<HTMLInputElement>(null)
  const cropCanvas = useRef<HTMLCanvasElement>(null)
  const imgRef     = useRef<HTMLImageElement | null>(null)

  // Quando usuário seleciona arquivo
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const src = URL.createObjectURL(file)
    setCrop({ src, x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0 })
    setMsg('')
    e.target.value = ''
  }

  // Pré-carregar imagem para saber as dimensões
  useEffect(() => {
    if (!crop) return
    const img = new window.Image()
    img.src = crop.src
    img.onload = () => {
      imgRef.current = img
      // Zoom inicial para preencher o quadrado
      const minScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
      setCrop(c => c ? { ...c, scale: minScale, x: 0, y: 0 } : c)
    }
    return () => URL.revokeObjectURL(crop.src)
  }, [crop?.src])

  // Drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const { clientX, clientY } = 'touches' in e ? e.touches[0] : e
    setCrop(c => c ? { ...c, dragging: true, startX: clientX - c.x, startY: clientY - c.y } : c)
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setCrop(c => {
      if (!c?.dragging || !imgRef.current) return c
      const { clientX, clientY } = 'touches' in e ? e.touches[0] : e
      const img     = imgRef.current
      const w       = img.naturalWidth  * c.scale
      const h       = img.naturalHeight * c.scale
      const newX    = Math.min(0, Math.max(CROP_SIZE - w, clientX - c.startX))
      const newY    = Math.min(0, Math.max(CROP_SIZE - h, clientY - c.startY))
      return { ...c, x: newX, y: newY }
    })
  }, [])

  const onMouseUp = useCallback(() => {
    setCrop(c => c ? { ...c, dragging: false } : c)
  }, [])

  // Zoom via slider
  function onZoom(e: React.ChangeEvent<HTMLInputElement>) {
    const scale = Number(e.target.value)
    setCrop(c => {
      if (!c || !imgRef.current) return c
      const img  = imgRef.current
      const w    = img.naturalWidth  * scale
      const h    = img.naturalHeight * scale
      const newX = Math.min(0, Math.max(CROP_SIZE - w, c.x))
      const newY = Math.min(0, Math.max(CROP_SIZE - h, c.y))
      return { ...c, scale, x: newX, y: newY }
    })
  }

  // Crop + upload
  async function confirmarCrop() {
    if (!crop || !imgRef.current) return
    setUploading(true)
    setMsg('')

    const canvas = cropCanvas.current!
    canvas.width  = CROP_SIZE
    canvas.height = CROP_SIZE
    const ctx = canvas.getContext('2d')!
    const img = imgRef.current

    ctx.drawImage(
      img,
      -crop.x / crop.scale,
      -crop.y / crop.scale,
      CROP_SIZE / crop.scale,
      CROP_SIZE / crop.scale,
      0, 0, CROP_SIZE, CROP_SIZE,
    )

    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.9))
    if (!blob) { setMsg('Erro ao processar imagem.'); setUploading(false); return }

    const form = new FormData()
    form.append('avatar', blob, 'avatar.jpg')

    const res  = await fetch('/api/perfil/avatar', { method: 'POST', body: form })
    const json = await res.json()

    if (res.ok) {
      setAvatar(json.avatar_url + '?t=' + Date.now()) // cache busting
      setMsg('Foto atualizada!')
      setCrop(null)
    } else {
      setMsg(json.error ?? 'Erro ao enviar foto.')
    }
    setUploading(false)
  }

  async function salvarNome() {
    setSaving(true)
    setMsg('')
    const res  = await fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const json = await res.json()
    setMsg(res.ok ? 'Nome salvo!' : (json.error ?? 'Erro.'))
    setSaving(false)
  }

  const initials = (name || phone).slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-sm mx-auto space-y-8">

        {/* Header */}
        <div>
          <a href="/meus-eventos" className="text-gray-500 text-sm hover:text-gray-400">← Meus eventos</a>
          <h1 className="text-2xl font-extrabold mt-3">Meu perfil</h1>
          <p className="text-gray-500 text-xs mt-0.5">{phone}</p>
        </div>

        {/* Avatar atual + botão */}
        {!crop && (
          <div className="flex flex-col items-center gap-4">
            <button onClick={() => fileRef.current?.click()} className="relative group">
              {avatar ? (
                <Image
                  src={avatar} alt="avatar" width={96} height={96}
                  className="w-24 h-24 rounded-full object-cover border-2 border-violet-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-extrabold border-2 border-violet-500">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold">✏️ alterar</span>
              </div>
            </button>
            <p className="text-gray-500 text-xs">Toque na foto para alterar</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          </div>
        )}

        {/* Editor de crop */}
        {crop && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-300 text-center">Arraste para centralizar</p>

            {/* Área de crop */}
            <div
              className="mx-auto overflow-hidden rounded-full border-4 border-violet-500 select-none cursor-grab active:cursor-grabbing"
              style={{ width: CROP_SIZE, height: CROP_SIZE, position: 'relative' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onMouseDown}
              onTouchMove={onMouseMove}
              onTouchEnd={onMouseUp}
            >
              {imgRef.current && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={crop.src}
                  alt="preview"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    width:  imgRef.current.naturalWidth  * crop.scale,
                    height: imgRef.current.naturalHeight * crop.scale,
                    left: crop.x,
                    top:  crop.y,
                    userSelect: 'none',
                  }}
                />
              )}
            </div>

            {/* Zoom */}
            {imgRef.current && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 text-center">Zoom</p>
                <input
                  type="range"
                  min={Math.max(CROP_SIZE / (imgRef.current.naturalWidth || 1), CROP_SIZE / (imgRef.current.naturalHeight || 1))}
                  max={3}
                  step={0.01}
                  value={crop.scale}
                  onChange={onZoom}
                  className="w-full accent-violet-500"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCrop(null)}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCrop}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm"
              >
                {uploading ? 'Salvando…' : 'Usar esta foto ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Nome */}
        {!crop && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Como quer ser chamado?
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-base"
            />
            <button
              onClick={salvarNome}
              disabled={saving || !name.trim()}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold transition-colors"
            >
              {saving ? 'Salvando…' : 'Salvar nome'}
            </button>
          </div>
        )}

        {msg && (
          <p className={`text-sm text-center ${msg.includes('!') ? 'text-green-400' : 'text-red-400'}`}>
            {msg}
          </p>
        )}

        {/* Canvas oculto para crop */}
        <canvas ref={cropCanvas} className="hidden" />

      </div>
    </div>
  )
}
