'use client'

import { useState } from 'react'
import AvatarCropUpload from '@/components/AvatarCropUpload'

type Props = {
  userId: string
  phone: string
  name: string | null
  avatarUrl: string | null
  bio: string | null
  vibe: string | null
  instagram: string | null
}

export default function PerfilClient({ phone, name: initialName, avatarUrl: initialAvatar, bio: initialBio, vibe: initialVibe, instagram: initialInstagram }: Props) {
  const [name,      setName]      = useState(initialName ?? '')
  const [avatar,    setAvatar]    = useState(initialAvatar)
  const [bio,       setBio]       = useState(initialBio ?? '')
  const [vibe,      setVibe]      = useState(initialVibe ?? '')
  const [instagram, setInstagram] = useState(initialInstagram ?? '')
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState('')

  const perfilIncompleto = !avatar || !bio.trim() || !instagram.trim()

  async function salvarPerfil() {
    setSaving(true)
    setMsg('')
    const res  = await fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, vibe, instagram }),
    })
    const json = await res.json()
    if (res.ok && json.instagram !== undefined) setInstagram(json.instagram ?? '')
    setMsg(res.ok ? 'Perfil salvo!' : (json.error ?? 'Erro.'))
    setSaving(false)
  }

  const initials = (name || phone).slice(0, 2).toUpperCase()

  return (
    <div className="max-w-sm mx-auto space-y-8">

      <p className="text-gray-400 text-xs">{phone}</p>

      {perfilIncompleto && (
        <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 space-y-1">
          <p className="text-sm font-bold text-brand">Capriche na sua assinatura!</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Foto, bio e @ aparecem embaixo do seu nome em todo convite que você
            criar — sem eles, a assinatura fica sem graça. Vale a pena preencher
            uma vez só.
          </p>
        </div>
      )}

      <AvatarCropUpload
        avatar={avatar}
        onUploaded={url => { setAvatar(url); setMsg('Foto atualizada!') }}
        fallbackInitials={initials}
        hint="Toque na foto para alterar"
      />

      {/* Nome + assinatura do convite */}
      <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Como quer ser chamado?
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 140))}
              placeholder="Uma frase curta sobre você"
              rows={2}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
            />
            <p className="text-[10px] text-gray-400">Aparece na assinatura dos seus convites, embaixo do seu nome. {bio.length}/140</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Instagram
            </label>
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 focus-within:border-brand">
              <span className="text-gray-400 text-sm">@</span>
              <input
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                placeholder="seu.instagram"
                className="w-full bg-transparent py-3 pl-1 text-gray-900 placeholder-gray-400 outline-none text-sm"
              />
            </div>
            <p className="text-[10px] text-gray-400">Também aparece na assinatura dos seus convites.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Qual é a sua vibe?
            </label>
            <textarea
              value={vibe}
              onChange={e => setVibe(e.target.value)}
              placeholder="O que você gosta de fazer e não gosta de fazer?"
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
            />
            <p className="text-[10px] text-gray-400">Não aparece no convite — é só pra IA entender seu estilo quando a gente gerar imagens personalizadas (em breve).</p>
          </div>

          <button
            onClick={salvarPerfil}
            disabled={saving || !name.trim()}
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold uppercase tracking-wide transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar perfil'}
          </button>
        </div>

      {msg && (
        <p className={`text-sm text-center ${msg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
