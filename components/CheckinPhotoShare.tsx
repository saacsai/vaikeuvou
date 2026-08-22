'use client'

import { useRef, useState } from 'react'

type Props = {
  eventoTitulo: string
  onPular: () => void
}

const MAX_WIDTH = 1080

export default function CheckinPhotoShare({ eventoTitulo, onPular }: Props) {
  const [preview,  setPreview]  = useState<string | null>(null)
  const [blob,     setBlob]     = useState<Blob | null>(null)
  const [gerando,  setGerando]  = useState(false)
  const fileRef   = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setGerando(true)

    const fotoUrl = URL.createObjectURL(file)
    const foto    = new window.Image()
    foto.src = fotoUrl
    await new Promise(r => { foto.complete ? r(null) : (foto.onload = r) })

    const logo = new window.Image()
    logo.src = '/logo.png'
    await new Promise(r => { logo.complete ? r(null) : (logo.onload = r) })

    const scale  = Math.min(1, MAX_WIDTH / foto.naturalWidth)
    const w = Math.round(foto.naturalWidth * scale)
    const h = Math.round(foto.naturalHeight * scale)

    const canvas = canvasRef.current!
    canvas.width  = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    ctx.drawImage(foto, 0, 0, w, h)

    // Faixa inferior com degradê escuro pra legibilidade do texto.
    const faixaAltura = Math.round(h * 0.22)
    const gradiente = ctx.createLinearGradient(0, h - faixaAltura, 0, h)
    gradiente.addColorStop(0, 'rgba(0,0,0,0)')
    gradiente.addColorStop(1, 'rgba(0,0,0,0.75)')
    ctx.fillStyle = gradiente
    ctx.fillRect(0, h - faixaAltura, w, faixaAltura)

    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.round(w * 0.07)}px Arial`
    ctx.fillText('EU FUI', w * 0.05, h - faixaAltura * 0.5)

    ctx.font = `${Math.round(w * 0.032)}px Arial`
    ctx.fillText(eventoTitulo, w * 0.05, h - faixaAltura * 0.5 + Math.round(w * 0.05))

    const logoW = w * 0.16
    const logoH = logoW * (logo.naturalHeight / logo.naturalWidth)
    ctx.drawImage(logo, w - logoW - w * 0.05, h - logoH - h * 0.03, logoW, logoH)

    URL.revokeObjectURL(fotoUrl)

    const novoBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.92))
    setGerando(false)
    if (!novoBlob) return
    setBlob(novoBlob)
    setPreview(URL.createObjectURL(novoBlob))
  }

  async function compartilhar() {
    if (!blob) return
    const file = new File([blob], 'eu-fui.jpg', { type: 'image/jpeg' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `Eu fui em ${eventoTitulo}! 🎉` })
        return
      } catch {
        // Cancelou o share nativo — deixa a pessoa usar o download abaixo.
      }
    }
  }

  return (
    <div className="space-y-4">
      {!preview && (
        <div className="text-center space-y-4">
          <p className="text-gray-700 font-semibold text-sm">Tire uma foto desse momento pra compartilhar</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={gerando}
            className="w-full py-3.5 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wide"
          >
            {gerando ? 'Gerando…' : 'Tirar foto'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={onFileChange} className="hidden" />
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Eu fui" className="w-full rounded-lg" />
          <div className="flex gap-2">
            <a
              href={preview}
              download="eu-fui.jpg"
              className="flex-1 text-center py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm uppercase tracking-wide hover:bg-gray-200"
            >
              Baixar
            </a>
            <button
              type="button"
              onClick={compartilhar}
              className="flex-1 py-3 rounded-lg bg-brand hover:bg-brand-dark text-white font-bold text-sm uppercase tracking-wide"
            >
              Compartilhar
            </button>
          </div>
        </div>
      )}

      <button type="button" onClick={onPular} className="w-full text-gray-400 text-sm py-2 uppercase tracking-wide">
        Pular
      </button>

      <a href="/" className="block w-full text-center text-gray-400 text-sm py-2">
        Sair
      </a>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
