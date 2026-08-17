'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'

type Props = {
  userId: string
  phone: string
  name: string | null
  avatarUrl: string | null
  bio: string | null
  vibe: string | null
  instagram: string | null
}

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

const CROP_SIZE = 256

export default function PerfilClient({ phone, name: initialName, avatarUrl: initialAvatar, bio: initialBio, vibe: initialVibe, instagram: initialInstagram }: Props) {
  const [name,      setName]      = useState(initialName ?? '')
  const [avatar,    setAvatar]    = useState(initialAvatar)
  const [bio,       setBio]       = useState(initialBio ?? '')
  const [vibe,      setVibe]      = useState(initialVibe ?? '')
  const [instagram, setInstagram] = useState(initialInstagram ?? '')
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg,       setMsg]       = useState('')
  const [crop,      setCrop]      = useState<CropState | null>(null)

  const perfilIncompleto = !avatar || !bio.trim() || !instagram.trim()

  const fileRef    = useRef<HTMLInputElement>(null)
  const cropCanvas = useRef<HTMLCanvasElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const src = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      const minScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
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

  // Cleanup object URL
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
      const newX = Math.min(0, Math.max(CROP_SIZE - w, e.clientX - c.startX))
      const newY = Math.min(0, Math.max(CROP_SIZE - h, e.clientY - c.startY))
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
      const newX = Math.min(0, Math.max(CROP_SIZE - w, c.x))
      const newY = Math.min(0, Math.max(CROP_SIZE - h, c.y))
      return { ...c, scale, x: newX, y: newY }
    })
  }

  async function confirmarCrop() {
    if (!crop) return
    setUploading(true)
    setMsg('')

    const canvas = cropCanvas.current!
    canvas.width  = CROP_SIZE
    canvas.height = CROP_SIZE
    const ctx = canvas.getContext('2d')!

    const img = new window.Image()
    img.src = crop.src
    await new Promise(r => { img.complete ? r(null) : (img.onload = r) })

    ctx.drawImage(
      img,
      -crop.x / crop.scale,
      -crop.y / crop.scale,
      CROP_SIZE / crop.scale,
      CROP_SIZE / crop.scale,
      0, 0, CROP_SIZE, CROP_SIZE,
    )

    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.92))
    if (!blob) { setMsg('Erro ao processar imagem.'); setUploading(false); return }

    const form = new FormData()
    form.append('avatar', blob, 'avatar.jpg')

    const res  = await fetch('/api/perfil/avatar', { method: 'POST', body: form })
    const json = await res.json()

    if (res.ok) {
      setAvatar(json.avatar_url + '?t=' + Date.now())
      setMsg('Foto atualizada!')
      setCrop(null)
    } else {
      setMsg(json.error ?? 'Erro ao enviar foto.')
    }
    setUploading(false)
  }

  async function salvarPerfil() {
    setSaving(true)
    setMsg('')
    const res  = await fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, vibe, instagram }),
    })
    const json = await res.json()
    if (res.ok && json.instagram !== undefined) setInstagram(json.instagram ?? '')
    setMsg(res.ok ? 'Perfil salvo!' : (json.error ?? 'Erro.'))
    setSaving(false)
  }

  const initials = (name || phone).slice(0, 2).toUpperCase()
  const minScale = crop ? Math.max(CROP_SIZE / crop.naturalW, CROP_SIZE / crop.naturalH) : 1

  return (
    <div className="max-w-sm mx-auto space-y-8">

      <p className="text-gray-400 text-xs">{phone}</p>

      {!crop && perfilIncompleto && (
        <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 space-y-1">
          <p className="text-sm font-bold text-brand">Capriche na sua assinatura!</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Foto, bio e @ aparecem embaixo do seu nome em todo convite que você
            criar — sem eles, a assinatura fica sem graça. Vale a pena preencher
            uma vez só.
          </p>
        </div>
      )}

      {/* Avatar atual */}
      {!crop && (
        <div className="flex flex-col items-center gap-4">
          <button onClick={() => fileRef.current?.click()} className="relative group">
            {avatar ? (
              <Image
                src={avatar} alt="avatar" width={96} height={96}
                className="w-24 h-24 rounded-full object-cover border-2 border-brand"
                unoptimized
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand flex items-center justify-center text-3xl font-extrabold text-white border-2 border-brand">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">✏️ alterar</span>
            </div>
          </button>
          <p className="text-gray-400 text-xs">Toque na foto para alterar</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        </div>
      )}

      {/* Crop */}
      {crop && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700 text-center">Arraste para centralizar</p>

          <div
            className="mx-auto rounded-full border-4 border-brand overflow-hidden select-none"
            style={{ width: CROP_SIZE, height: CROP_SIZE, position: 'relative', cursor: crop.dragging ? 'grabbing' : 'grab' }}
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
                maxWidth: 'none',   // cancela max-width: 100% do Tailwind
                left:     crop.x,
                top:      crop.y,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-400 text-center">Zoom</p>
            <input
              type="range"
              min={minScale}
              max={Math.min(minScale * 4, 3)}
              step={0.005}
              value={crop.scale}
              onChange={onZoom}
              className="w-full accent-brand"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCrop(null)}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarCrop}
              disabled={uploading}
              className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm"
            >
              {uploading ? 'Salvando…' : 'Usar esta foto ✓'}
            </button>
          </div>
        </div>
      )}

      {/* Nome + assinatura do convite */}
      {!crop && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Como quer ser chamado?
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 140))}
              placeholder="Uma frase curta sobre você"
              rows={2}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
            />
            <p className="text-[10px] text-gray-400">Aparece na assinatura dos seus convites, embaixo do seu nome. {bio.length}/140</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Instagram
            </label>
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 focus-within:border-brand">
              <span className="text-gray-400 text-sm">@</span>
              <input
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                placeholder="seu.instagram"
                className="w-full bg-transparent py-3 pl-1 text-gray-900 placeholder-gray-400 outline-none text-sm"
              />
            </div>
            <p className="text-[10px] text-gray-400">Também aparece na assinatura dos seus convites.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Qual é a sua vibe?
            </label>
            <textarea
              value={vibe}
              onChange={e => setVibe(e.target.value)}
              placeholder="O que você gosta de fazer e não gosta de fazer?"
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
            />
            <p className="text-[10px] text-gray-400">Não aparece no convite — é só pra IA entender seu estilo quando a gente gerar imagens personalizadas (em breve).</p>
          </div>

          <button
            onClick={salvarPerfil}
            disabled={saving || !name.trim()}
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar perfil'}
          </button>
        </div>
      )}

      {msg && (
        <p className={`text-sm text-center ${msg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>
          {msg}
        </p>
      )}

      <canvas ref={cropCanvas} className="hidden" />
    </div>
  )
}
