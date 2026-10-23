'use client'

import { useState } from 'react'

export default function ConfirmarProdutoButton({
  editToken, rsvpId, confirmadoInicial,
}: {
  editToken: string
  rsvpId: string
  confirmadoInicial: boolean
}) {
  const [confirmado, setConfirmado] = useState(confirmadoInicial)
  const [saving, setSaving] = useState(false)

  if (confirmado) {
    return <span className="text-[9px] font-semibold text-green-600 bg-green-50 rounded-full px-1.5 py-0.5">🌱 recebido</span>
  }

  return (
    <button
      disabled={saving}
      onClick={async () => {
        setSaving(true)
        const res = await fetch('/api/rsvp/confirmar-produto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ edit_token: editToken, rsvp_id: rsvpId }),
        })
        if (res.ok) setConfirmado(true)
        setSaving(false)
      }}
      className="text-[9px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full px-1.5 py-0.5 disabled:opacity-50"
    >
      {saving ? '...' : '🌱 confirmar'}
    </button>
  )
}
