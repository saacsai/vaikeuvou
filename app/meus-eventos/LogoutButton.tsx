'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <button
      onClick={logout}
      className="text-gray-500 text-xs hover:text-gray-400 px-3 py-2"
    >
      Sair
    </button>
  )
}
