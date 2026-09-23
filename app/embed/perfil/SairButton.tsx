'use client'

export default function SairButton() {
  async function sair() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={sair}
      className="block w-full text-center mt-3 pt-3 pb-2.5 border-t border-gray-100 rounded-lg hover:bg-gray-50 text-sm font-semibold uppercase tracking-wide text-gray-400"
    >
      Sair
    </button>
  )
}
