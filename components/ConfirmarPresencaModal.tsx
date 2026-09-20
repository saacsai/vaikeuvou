'use client'

import { useState } from 'react'
import Image from 'next/image'

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type Props = {
  tituloEvento: string
  pago: boolean
  valor: number | null
  maxParcelas: number
  nome: string
  telefone: string
  onNomeChange: (v: string) => void
  onTelefoneChange: (v: string) => void
  onConfirmar: () => void
  onClose: () => void
  saving: boolean
  erro: string
}

export default function ConfirmarPresencaModal({
  tituloEvento, pago, valor, maxParcelas, nome, telefone,
  onNomeChange, onTelefoneChange, onConfirmar, onClose, saving, erro,
}: Props) {
  const [passo, setPasso] = useState(pago ? 1 : 2)
  const totalPassos = pago ? 2 : 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg leading-none">
          ✕
        </button>

        {totalPassos > 1 && (
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {[1, 2].map(n => (
              <div key={n} className={`h-1.5 rounded-full transition-all ${n === passo ? 'w-6 bg-brand' : 'w-1.5 bg-gray-200'}`} />
            ))}
          </div>
        )}

        {passo === 1 && (
          <div className="text-center space-y-5">
            <div className="text-4xl">🎟️</div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Você vai confirmar presença em</p>
              <h2 className="text-lg font-bold text-gray-900">{tituloEvento}</h2>
            </div>
            {pago && valor && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="text-xl font-extrabold text-brand">{fmtBRL(valor)} por pessoa</p>
                {maxParcelas > 1 && (
                  <p className="text-xs text-gray-400">parcelamento disponível no pagamento</p>
                )}
              </div>
            )}
            <button
              onClick={() => setPasso(2)}
              className="w-full py-3.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm uppercase tracking-wide"
            >
              Continuar →
            </button>
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Só mais dois campos 😄</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Seu nome</label>
              <input
                value={nome}
                onChange={e => onNomeChange(e.target.value)}
                placeholder="Como te chamam?"
                autoFocus
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Seu WhatsApp</label>
              <input
                type="tel"
                value={telefone}
                onChange={e => onTelefoneChange(e.target.value)}
                placeholder="11 99999-0000"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
              />
            </div>
            {erro && <p className="text-red-500 text-sm">{erro}</p>}
            {pago && valor && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                💳 Confirmar abre o pagamento de {fmtBRL(valor)} — sua presença só fica garantida depois de pago.
              </p>
            )}
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Ao confirmar, você concorda com os{' '}
              <a href="/termos" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Termos de Uso</a>
              {' '}e a{' '}
              <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Política de Privacidade</a>.
            </p>
            <button
              onClick={onConfirmar}
              disabled={saving}
              className="w-full py-4 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-lg uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                pago ? 'Abrindo pagamento…' : 'Confirmando…'
              ) : pago && valor ? (
                'Efetuar pagamento'
              ) : (
                <>
                  <span className="flex items-center gap-[5px]">
                    <span className="text-[21.6px]">BORA</span>
                    <Image src="/icone_bora.png" alt="" width={474} height={537} className="h-7 w-auto" />
                  </span>
                  Confirmar
                </>
              )}
            </button>
            {pago && (
              <button onClick={() => setPasso(1)} className="w-full text-gray-400 text-sm py-1 uppercase tracking-wide">
                Voltar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
