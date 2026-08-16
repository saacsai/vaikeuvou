'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  trigger: ReactNode
  label: string
  children: ReactNode
}

export default function HeaderPopover({ trigger, label, children }: Props) {
  const [open, setOpen] = useState(false)
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

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={label}
        className="w-10 h-10 md:w-11 md:h-11 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
      >
        {trigger}
      </button>

      {open && (
        <>
          {/* Mobile — tela cheia */}
          <div className="md:hidden fixed inset-0 z-50 bg-gradient-to-b from-white to-[#fcede1] overflow-y-auto">
            <div className="flex justify-end p-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 pb-10">{children}</div>
          </div>

          {/* Desktop — painel flutuante */}
          <div className="hidden md:block absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-5 pb-5 -mt-1">{children}</div>
          </div>
        </>
      )}
    </div>
  )
}
