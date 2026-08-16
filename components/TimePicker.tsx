'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string // HH:MM ou ''
  onChange: (v: string) => void
}

const HORARIOS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export default function TimePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      selectedRef.current?.scrollIntoView({ block: 'center' })
    }
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full text-left bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-brand text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}
      >
        {value || 'HH:MM'}
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-[240px] overflow-y-auto p-1.5">
          {HORARIOS.map(h => (
            <button
              key={h}
              ref={h === value ? selectedRef : undefined}
              type="button"
              onClick={() => { onChange(h); setOpen(false) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${h === value ? 'bg-brand text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
