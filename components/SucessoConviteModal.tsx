'use client'

import { useState } from 'react'
import AvatarCropUpload from '@/components/AvatarCropUpload'

type Props = {
  rsvpId: string
  nome: string
  pago: boolean
  linkConvite: string
  whatsappTxt: string
  onClose: () => void
}

const TOTAL_ETAPAS = 3

export default function SucessoConviteModal({ rsvpId, nome, pago, linkConvite, whatsappTxt, onClose }: Props) {
  const [etapa,      setEtapa]      = useState(1)
  const [fotoUrl,    setFotoUrl]    = useState<string | null>(null)
  const [mensagem,   setMensagem]   = useState('')
  const [recortando, setRecortando] = useState(false)
  const [salvando,   setSalvando]   = useState(false)
  const [copiado,    setCopiado]    = useState(false)

  async function salvarESeguir() {
    if (mensagem.trim()) {
      setSalvando(true)
      await fetch('/api/rsvp/mensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvp_id: rsvpId, mensagem }),
      })
      setSalvando(false)
    }
    setEtapa(3)
  }

  function copiar() {
    navigator.clipboard.writeText(linkConvite)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ✕
        </button>

        {/* Indicador de etapa */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {Array.from({ length: TOTAL_ETAPAS }, (_, i) => i + 1).map(n => (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-all ${n === etapa ? 'w-6 bg-brand' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>

        {etapa === 1 && (
          <div className="text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{pago ? 'Pagamento confirmado!' : 'BORA confirmado!'}</h2>
              <p className="text-gray-500 text-sm">Sua inscrição foi realizada. Nos vemos lá!</p>
            </div>
            <button
              onClick={() => setEtapa(2)}
              className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm uppercase tracking-wide"
            >
              Convide seus amigos também →
            </button>
          </div>
        )}

        {etapa === 2 && (
          <div className="space-y-3 text-left">
            <p className="font-bold text-gray-900 text-sm">📸 Coloque sua foto</p>
            <p className="text-xs text-gray-500">Pra seus amigos te reconhecerem quando você convidar — em vez da foto de quem criou o evento.</p>

            <div className="flex justify-center py-1">
              <AvatarCropUpload
                avatar={fotoUrl}
                onUploaded={setFotoUrl}
                fallbackInitials={nome.slice(0, 2).toUpperCase() || '?'}
                uploadUrl="/api/rsvp/foto"
                extraFields={{ rsvp_id: rsvpId }}
                onCropStateChange={setRecortando}
              />
            </div>
            {fotoUrl && !recortando && <p className="text-xs text-green-600 text-center font-semibold">✓ Foto confirmada</p>}
            {recortando && <p className="text-xs text-amber-600 text-center font-semibold">☝️ Clique em &quot;Usar esta foto ✓&quot; pra confirmar</p>}

            <textarea
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              placeholder="Escreva uma mensagem — ex: Vem comigo, vai ser demais!"
              rows={2}
              maxLength={200}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand resize-none"
            />

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEtapa(3)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wide hover:bg-gray-200"
              >
                Pular
              </button>
              <button
                onClick={salvarESeguir}
                disabled={salvando || recortando}
                className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide"
              >
                {salvando ? 'Salvando…' : 'Próximo →'}
              </button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div className="space-y-3 text-left">
            <p className="font-bold text-gray-900 text-sm">Convide seus amigos e contatos também 👇</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={linkConvite}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono outline-none"
              />
              <button
                onClick={copiar}
                className="px-3 py-2 rounded-xl bg-gray-200 text-xs text-gray-700 font-semibold uppercase tracking-wide whitespace-nowrap hover:bg-gray-300"
              >
                {copiado ? '✓' : 'Copiar'}
              </button>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappTxt)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm"
            >
              Enviar no WhatsApp
            </a>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wide hover:bg-gray-200"
            >
              Concluir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
