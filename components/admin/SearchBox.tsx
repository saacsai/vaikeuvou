'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Props = { basePath: string; placeholder: string }

export default function SearchBox({ basePath, placeholder }: Props) {
  const router  = useRouter()
  const params  = useSearchParams()
  const [valor, setValor] = useState(params.get('q') ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const q = valor.trim()
      router.push(q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath)
    }, 300)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])

  return (
    <input
      type="text"
      value={valor}
      onChange={e => setValor(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-brand"
    />
  )
}
