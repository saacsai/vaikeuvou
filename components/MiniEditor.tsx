'use client'

import { useRef } from 'react'
import { wrapSelection, type MiniMarkupMarker } from '@/lib/miniMarkup'

type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}

const BOTOES: { marker: MiniMarkupMarker; label: string; className: string }[] = [
  { marker: 'bold',      label: 'N', className: 'font-bold' },
  { marker: 'italic',    label: 'I', className: 'italic' },
  { marker: 'underline', label: 'S', className: 'underline' },
]

// Editor mínimo — negrito/itálico/sublinhado, nada além disso. Guarda como
// texto com marcação leve (**negrito**, _itálico_, ++sublinhado++), não
// HTML — renderiza de verdade via renderMiniMarkup (lib/miniMarkup.ts).
export default function MiniEditor({ value, onChange, placeholder, rows = 3 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function aplicar(marker: MiniMarkupMarker) {
    const el = ref.current
    if (!el) return
    const { text, selStart, selEnd } = wrapSelection(value, el.selectionStart, el.selectionEnd, marker)
    onChange(text)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(selStart, selEnd)
    })
  }

  return (
    <div>
      <div className="flex gap-1 mb-1.5">
        {BOTOES.map(b => (
          <button
            key={b.marker}
            type="button"
            onClick={() => aplicar(b.marker)}
            title={b.marker}
            className={`w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-700 ${b.className}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
      />
    </div>
  )
}
