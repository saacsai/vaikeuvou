'use client'

import { useState } from 'react'
import Image from 'next/image'
import CheckinPhotoShare from '@/components/CheckinPhotoShare'

type Props = {
  rsvpId: string
  userName: string
  eventoTitulo: string
  jaConfirmado: boolean
}

function pegarGeoComTimeout(timeoutMs = 5000): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return }
    const timer = setTimeout(() => resolve(null), timeoutMs)
    navigator.geolocation.getCurrentPosition(
      pos => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
      () => { clearTimeout(timer); resolve(null) },
      { timeout: timeoutMs },
    )
  })
}

export default function CheckinClient({ rsvpId, userName, eventoTitulo, jaConfirmado }: Props) {
  const [etapa, setEtapa] = useState<'inicial' | 'confirmando' | 'sucesso' | 'foto'>(
    jaConfirmado ? 'sucesso' : 'inicial',
  )

  async function confirmarPresenca() {
    setEtapa('confirmando')

    // Tenta pegar geolocalização em segundo plano — nunca bloqueia a
    // confirmação, seja qual for o resultado (negada, indisponível, lenta).
    const geo = await pegarGeoComTimeout()

    await fetch(`/api/checkin/${rsvpId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geo ?? {}),
    })

    setEtapa('sucesso')
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#fcede1]">
      <div className="relative w-full max-w-lg bg-white sm:my-8 sm:rounded-lg sm:shadow-xl overflow-hidden px-6 pt-8 pb-8">
        <Image src="/logo.png" alt="vaikeuvou" width={1161} height={201} className="w-[200px] max-w-full h-auto mb-6" />

        {etapa === 'inicial' && (
          <div className="space-y-4">
            <p className="text-gray-900 font-bold text-xl leading-tight">Oi, {userName.split(' ')[0]}!</p>
            <p className="text-gray-500 text-sm">
              Você confirmou presença em <span className="font-semibold text-gray-700">{eventoTitulo}</span>. Foi mesmo?
            </p>
            <button
              onClick={confirmarPresenca}
              className="w-full py-4 rounded-lg bg-brand hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20 text-white font-bold text-2xl uppercase tracking-wide"
            >
              Eu fui
            </button>
          </div>
        )}

        {etapa === 'confirmando' && (
          <p className="text-gray-400 text-sm">Confirmando…</p>
        )}

        {etapa === 'sucesso' && (
          <div className="text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Presença confirmada!</h2>
              <p className="text-gray-500 text-sm">Legal que você foi no {eventoTitulo}.</p>
            </div>
            <button
              onClick={() => setEtapa('foto')}
              className="w-full py-3.5 rounded-lg bg-brand hover:bg-brand-dark transition-colors text-white font-bold text-sm uppercase tracking-wide"
            >
              Tirar foto pra compartilhar
            </button>
          </div>
        )}

        {etapa === 'foto' && (
          <CheckinPhotoShare eventoTitulo={eventoTitulo} onPular={() => setEtapa('sucesso')} />
        )}
      </div>
    </div>
  )
}
