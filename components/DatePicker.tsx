'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string // YYYY-MM-DD ou ''
  onChange: (iso: string) => void
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function parseISO(iso: string): { y: number; m: number; d: number } | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) }
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function fmtDisplay(iso: string): string {
  const p = parseISO(iso)
  if (!p) return ''
  return `${String(p.d).padStart(2, '0')}/${String(p.m + 1).padStart(2, '0')}/${p.y}`
}

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selected = parseISO(value)
  const today = new Date()
  const [viewY, setViewY] = useState(selected?.y ?? today.getFullYear())
  const [viewM, setViewM] = useState(selected?.m ?? today.getMonth())
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function openPicker() {
    if (selected) { setViewY(selected.y); setViewM(selected.m) }
    setOpen(true)
  }

  function pickDay(d: number) {
    onChange(toISO(viewY, viewM, d))
    setOpen(false)
  }

  function prevMonth() {
    if (viewM === 0) { setViewM(11); setViewY(viewY - 1) } else { setViewM(viewM - 1) }
  }
  function nextMonth() {
    if (viewM === 11) { setViewM(0); setViewY(viewY + 1) } else { setViewM(viewM + 1) }
  }

  const firstWeekday = new Date(viewY, viewM, 1).getDay()
  const daysInMonth  = new Date(viewY, viewM + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isToday = (d: number) =>
    d === today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear()
  const isSelected = (d: number) =>
    !!selected && d === selected.d && viewM === selected.m && viewY === selected.y

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={openPicker}
        className={`w-full text-left bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-brand text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}
      >
        {value ? fmtDisplay(value) : 'DD/MM/AAAA'}
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-[280px] max-w-[calc(100vw-2.5rem)] bg-white border border-gray-200 rounded-lg shadow-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center">‹</button>
            <p className="text-sm font-semibold text-gray-900">{MESES[viewM]} {viewY}</p>
            <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS_SEMANA.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => (
              <button
                key={i}
                type="button"
                disabled={d === null}
                onClick={() => d && pickDay(d)}
                className={`aspect-square rounded-lg text-sm flex items-center justify-center
                  ${d === null ? 'invisible' : ''}
                  ${isSelected(d ?? -1) ? 'bg-brand text-white font-bold' : isToday(d ?? -1) ? 'border border-brand text-brand font-semibold' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
