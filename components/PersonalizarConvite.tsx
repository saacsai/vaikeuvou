'use client'

import { useState } from 'react'
import AvatarCropUpload from '@/components/AvatarCropUpload'

type Props = {
  rsvpId: string
  nome: string
}

export default function PersonalizarConvite({ rsvpId, nome }: Props) {
  const [aberto,    setAberto]    = useState(false)
  const [pronto,    setPronto]    = useState(false)
  const [fotoUrl,   setFotoUrl]   = useState<string | null>(null)
  const [mensagem,  setMensagem]  = useState('')
  const [salvando,  setSalvando]  = useState(false)

  async function salvarMensagem() {
    setSalvando(true)
    await fetch('/api/rsvp/mensagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvp_id: rsvpId, mensagem }),
    })
    setSalvando(false)
    setPronto(true)
  }

  if (pronto) {
    return <p className="text-xs text-green-600 font-semibold">✓ Convite personalizado — quem você convidar vai ver sua foto e mensagem.</p>
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-xs font-semibold text-brand hover:text-brand-dark uppercase tracking-wide"
      >
        Capriche no seu convite (opcional) →
      </button>
    )
  }

  return (
    <div className="space-y-3 bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500">Sua foto e mensagem aparecem pra quem você convidar — em vez da foto de quem criou o evento.</p>

      <AvatarCropUpload
        avatar={fotoUrl}
        onUploaded={setFotoUrl}
        fallbackInitials={nome.slice(0, 2).toUpperCase() || '?'}
        uploadUrl="/api/rsvp/foto"
        extraFields={{ rsvp_id: rsvpId }}
      />

      <textarea
        value={mensagem}
        onChange={e => setMensagem(e.target.value)}
        placeholder="Ex: Vem comigo, vai ser demais!"
        rows={2}
        maxLength={200}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand resize-none"
      />

      <div className="flex gap-2">
        <button
          onClick={() => setAberto(false)}
          className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wide hover:bg-gray-200"
        >
          Pular
        </button>
        <button
          onClick={salvarMensagem}
          disabled={salvando}
          className="flex-1 py-2 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide"
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
