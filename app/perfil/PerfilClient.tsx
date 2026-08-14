'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

type Props = {
  userId: string
  phone: string
  name: string | null
  avatarUrl: string | null
}

export default function PerfilClient({ userId, phone, name: initialName, avatarUrl: initialAvatar }: Props) {
  const [name,      setName]      = useState(initialName ?? '')
  const [avatar,    setAvatar]    = useState(initialAvatar)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg,       setMsg]       = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMsg('')

    const form = new FormData()
    form.append('avatar', file)

    const res  = await fetch('/api/perfil/avatar', { method: 'POST', body: form })
    const json = await res.json()

    if (res.ok) {
      setAvatar(json.avatar_url)
      setMsg('Foto atualizada!')
    } else {
      setMsg(json.error ?? 'Erro ao enviar foto.')
    }
    setUploading(false)
  }

  async function salvarNome() {
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const json = await res.json()
    setMsg(res.ok ? 'Nome salvo!' : (json.error ?? 'Erro.'))
    setSaving(false)
  }

  const initials = (name || phone).slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-sm mx-auto space-y-8">

        {/* Header */}
        <div>
          <a href="/meus-eventos" className="text-gray-500 text-sm hover:text-gray-400">← Meus eventos</a>
          <h1 className="text-2xl font-extrabold mt-3">Meu perfil</h1>
          <p className="text-gray-500 text-xs mt-0.5">{phone}</p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative group"
            disabled={uploading}
          >
            {avatar ? (
              <Image
                src={avatar}
                alt="avatar"
                width={96} height={96}
                className="w-24 h-24 rounded-full object-cover border-2 border-violet-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-extrabold border-2 border-violet-500">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">{uploading ? '…' : '✏️'}</span>
            </div>
          </button>
          <p className="text-gray-500 text-xs">Toque na foto para alterar</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            className="hidden"
          />
        </div>

        {/* Nome */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Como quer ser chamado?
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500 text-base"
          />
          <button
            onClick={salvarNome}
            disabled={saving || !name.trim()}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar nome'}
          </button>
        </div>

        {msg && (
          <p className={`text-sm text-center ${msg.includes('!') ? 'text-green-400' : 'text-red-400'}`}>
            {msg}
          </p>
        )}

      </div>
    </div>
  )
}
