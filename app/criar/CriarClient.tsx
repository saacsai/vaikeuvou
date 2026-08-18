'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import DatePicker from '@/components/DatePicker'
import TimePicker from '@/components/TimePicker'
import { ProfilePopover } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'
import EventPreviewCard from '@/components/EventPreviewCard'
import BgSelector from '@/components/BgSelector'
import AvatarCropUpload from '@/components/AvatarCropUpload'
import CreditLockPanel from '@/components/CreditLockPanel'
import type { EventFormFields } from '@/lib/eventForm'

const PRIVACIDADE = [
  { value: 1,   label: 'Privado',          desc: 'Só você convida' },
  { value: 2,   label: 'Amigos de amigos', desc: 'Quem confirmar pode convidar' },
  { value: 999, label: 'Aberto',           desc: 'Viralização ilimitada' },
]

type Form = EventFormFields

type Props = {
  userName: string | null
  userAvatar: string | null
  userBio: string | null
  userInstagram: string | null
  userCredits: number
  termsAccepted: boolean
}

export default function CriarClient({ userName, userAvatar, userBio, userInstagram, userCredits, termsAccepted }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Form>({
    title: '', event_date: '', event_time: '',
    location: '', description: '', max_depth: 2,
    external_url: '', external_url_label: '', video_url: '',
    bg_image_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [erro,   setErro]   = useState('')

  // Assinatura do convite — só pergunta o que ainda não está no perfil,
  // pra não obrigar a pessoa a sair daqui e ir preencher /perfil antes
  // de criar o convite.
  const [avatarUrl,         setAvatarUrl]         = useState(userAvatar)
  const [profileName,       setProfileName]       = useState('')
  const [profileBio,        setProfileBio]        = useState('')
  const [profileInstagram,  setProfileInstagram]  = useState('')

  // Foto própria de cabeçalho: o convite ainda não existe, então o upload de
  // verdade (e a cobrança de 1 crédito) só acontece depois de criar. Até lá,
  // só guarda o recorte pronto e mostra o preview localmente.
  const [pendingHeaderImage, setPendingHeaderImage] = useState<Blob | null>(null)

  // Vídeo custa 1 crédito, sempre — mesmo o primeiro. Fica travado até a
  // pessoa reconhecer o aviso, pra ninguém digitar achando que é de graça.
  const [videoStage, setVideoStage] = useState<'idle' | 'confirm' | 'unlocked'>('idle')
  const videoUnlocked = videoStage === 'unlocked'

  // Aceite de Termos/Privacidade — só pergunta uma vez, na primeira criação.
  const [aceitouTermos, setAceitouTermos] = useState(false)

  function set(k: keyof Form, v: string | number) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function onBgChange(v: string) {
    setPendingHeaderImage(null)
    set('bg_image_url', v)
  }

  function onHeaderImageCropped(blob: Blob, previewUrl: string) {
    setPendingHeaderImage(blob)
    set('bg_image_url', previewUrl)
  }

  async function criar() {
    if (!form.title || !form.event_date || !form.event_time) {
      setErro('Preencha pelo menos o título, a data e o horário.')
      return
    }

    if (!termsAccepted && !aceitouTermos) {
      setErro('Você precisa concordar com os Termos de Uso e a Política de Privacidade.')
      return
    }

    const querVideo  = videoUnlocked && form.video_url.trim() !== ''
    const querImagem = !!pendingHeaderImage
    const custoTotal = (querVideo ? 1 : 0) + (querImagem ? 1 : 0)

    if (custoTotal > 0) {
      const itens = [querVideo && 'vídeo', querImagem && 'foto'].filter(Boolean).join(' + ')
      const msgConfirm = `Criar esse convite vai debitar ${custoTotal} crédito${custoTotal > 1 ? 's' : ''} do seu saldo (${itens}). Confirma?`
      if (!window.confirm(msgConfirm)) return
    }

    setSaving(true)
    setErro('')

    // Salva no perfil só os campos que a pessoa preencheu aqui (os que
    // já existiam não são pedidos de novo, então nunca são reenviados).
    const profileUpdates: Record<string, string | boolean> = {}
    if (!userName && profileName.trim()) profileUpdates.name = profileName.trim()
    if (!userBio && profileBio.trim()) profileUpdates.bio = profileBio.trim()
    if (!userInstagram && profileInstagram.trim()) profileUpdates.instagram = profileInstagram.trim()
    if (!termsAccepted && aceitouTermos) profileUpdates.accept_terms = true
    if (Object.keys(profileUpdates).length > 0) {
      await fetch('/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileUpdates),
      })
    }

    const event_date = `${form.event_date}T${form.event_time}:00-03:00`

    // O convite nasce sem vídeo e sem foto própria (blob: URL não faz
    // sentido gravar) — os dois são cobrados e aplicados logo em seguida,
    // já com o edit_token em mãos.
    const res = await fetch('/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, event_date, video_url: '', bg_image_url: pendingHeaderImage ? '' : form.bg_image_url }),
    })
    const json = await res.json()

    if (!res.ok) { setErro(json.error ?? 'Erro ao criar convite.'); setSaving(false); return }

    if (querVideo) {
      const chargeRes = await fetch('/api/creditos/desbloquear-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_token: json.edit_token }),
      })
      // Se cobrou com sucesso, salva o vídeo. Se falhou (raro — saldo mudou
      // entre a confirmação e agora), o convite já existe, só sem vídeo.
      if (chargeRes.ok) {
        await fetch('/api/eventos/editar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ edit_token: json.edit_token, video_url: form.video_url }),
        })
      }
    }

    if (querImagem && pendingHeaderImage) {
      const imgForm = new FormData()
      imgForm.append('edit_token', json.edit_token)
      imgForm.append('imagem', pendingHeaderImage, 'header.jpg')
      // Convite já existe — se falhar aqui (ex: saldo mudou), fica sem a
      // foto, mas nada se perde, dá pra subir depois no painel.
      await fetch('/api/eventos/imagem-cabecalho', { method: 'POST', body: imgForm })
    }

    router.push(`/dashboard/${json.edit_token}?novo=1`)
  }

  const previewName      = userName ?? (profileName || null)
  const previewBio       = userBio ?? (profileBio || null)
  const previewInstagram = userInstagram ?? (profileInstagram || null)
  const initials          = (previewName ?? 'Você').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">

        <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1 mb-8">
          <div className="flex items-center justify-between md:contents">
            <a href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-[43px] md:h-[47px] w-auto" />
            </a>
            <div className="flex items-center gap-1 md:hidden">
              <ProfilePopover userName={userName} userAvatar={userAvatar} userCredits={userCredits} />
            </div>
          </div>

          <div className="flex items-center gap-x-2 flex-wrap md:flex-1">
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <a href="/meus-convites" className="text-gray-400 hover:text-gray-600 text-sm whitespace-nowrap">Meus convites</a>
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <span className="text-brand font-bold text-[25px] whitespace-nowrap">Criar convite</span>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <ProfilePopover userName={userName} userAvatar={userAvatar} userCredits={userCredits} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Formulário — mesma ordem do card real */}
          <div className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nome do evento *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Churrasco de Sábado"
                autoFocus
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Data *</label>
                <DatePicker value={form.event_date} onChange={v => set('event_date', v)} />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Horário *</label>
                <TimePicker value={form.event_time} onChange={v => set('event_time', v)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Local</label>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="Endereço ou nome do lugar"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
            </div>

            {/* Link externo */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Link externo</label>
              <input
                value={form.external_url}
                onChange={e => set('external_url', e.target.value)}
                placeholder="https://...(ingresso, mais informações, etc...)"
                type="url"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
            </div>

            {form.external_url && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Texto do botão</label>
                <input
                  value={form.external_url_label}
                  onChange={e => set('external_url_label', e.target.value)}
                  placeholder="Ex: Comprar ingresso 🎟️"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                />
              </div>
            )}

            {/* Assinatura — só pergunta o que falta no perfil */}
            {!avatarUrl && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sua foto</label>
                <AvatarCropUpload
                  avatar={avatarUrl}
                  onUploaded={setAvatarUrl}
                  fallbackInitials={initials}
                />
                <p className="text-[10px] text-gray-400 mt-1 text-center">Aparece na assinatura do seu convite — sem ela fica sem graça.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Comentários</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Personalize a mensagem com um convite especial para quem está recebendo."
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quem pode convidar?</label>
              <div className="grid grid-cols-3 gap-2">
                {PRIVACIDADE.map(p => (
                  <button
                    key={p.value}
                    onClick={() => set('max_depth', p.value)}
                    className={`rounded-xl p-3 text-left border transition-colors ${
                      form.max_depth === p.value
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-900">{p.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {!userName && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Como quer ser chamado?</label>
                <input
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
                />
              </div>
            )}

            {!userBio && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Bio</label>
                <textarea
                  value={profileBio}
                  onChange={e => setProfileBio(e.target.value.slice(0, 140))}
                  placeholder="Você pode usar a mesma do Instagram"
                  rows={2}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Aparece na assinatura do seu convite.</p>
              </div>
            )}

            {!userInstagram && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Instagram</label>
                <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 focus-within:border-brand">
                  <span className="text-gray-400 text-sm">@</span>
                  <input
                    value={profileInstagram}
                    onChange={e => setProfileInstagram(e.target.value)}
                    placeholder="seu.instagram"
                    className="w-full bg-transparent py-3 pl-1 text-gray-900 placeholder-gray-400 outline-none text-sm"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Também aparece na assinatura do seu convite.</p>
              </div>
            )}

            {/* BG selector — mobile (some antes do botão, no desktop fica junto ao preview) */}
            <div className="lg:hidden">
              <BgSelector value={form.bg_image_url} onChange={onBgChange} title={form.title} onCropped={onHeaderImageCropped} credits={userCredits} />
            </div>

            {/* Vídeo — travado até a pessoa reconhecer o custo, pra ninguém
                digitar o link achando que é de graça. */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Vídeo do convite
              </label>
              {videoStage === 'unlocked' && (
                <>
                  <input
                    value={form.video_url}
                    onChange={e => set('video_url', e.target.value)}
                    placeholder="Cole o link do vídeo do YouTube/Vimeo"
                    type="url"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Aparece abaixo do botão BORA na página do convite</p>
                </>
              )}
              {videoStage === 'confirm' && (
                <CreditLockPanel
                  title="Adicionar vídeo custa 1 crédito"
                  message={`Vai debitar 1 crédito do seu saldo (${userCredits} disponíveis) quando você criar o convite.`}
                  credits={userCredits}
                  onCancel={() => setVideoStage('idle')}
                  onContinue={() => setVideoStage('unlocked')}
                />
              )}
              {videoStage === 'idle' && (
                <button
                  type="button"
                  onClick={() => setVideoStage('confirm')}
                  className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-300 rounded-xl px-4 py-3 text-amber-700 font-semibold text-sm transition-colors"
                >
                  <LockIcon className="w-4 h-4 text-amber-500" />
                  Adicionar vídeo — 1 crédito
                </button>
              )}
            </div>

            {!termsAccepted && (
              <label className="flex items-start gap-1.5 text-xs text-gray-500 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={e => setAceitouTermos(e.target.checked)}
                  className="mt-0.5 w-4 h-4 flex-shrink-0 accent-brand"
                />
                <span>
                  Li e concordo com os{' '}
                  <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-brand font-semibold hover:underline">Termos de Uso</a>
                  {' '}e a{' '}
                  <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-brand font-semibold hover:underline">Política de Privacidade</a>
                </span>
              </label>
            )}

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            <button
              onClick={criar}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-lg uppercase tracking-wide transition-colors"
            >
              {saving ? 'Criando…' : 'Criar convite'}
            </button>
          </div>

          {/* Preview — desktop only */}
          <div className="hidden lg:block">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 text-center">Preview</p>
            <div className="sticky top-6 space-y-3">
              <EventPreviewCard form={form} userName={previewName} userAvatar={avatarUrl} userBio={previewBio} userInstagram={previewInstagram} />
              <BgSelector value={form.bg_image_url} onChange={onBgChange} title={form.title} onCropped={onHeaderImageCropped} credits={userCredits} />
            </div>
          </div>

        </div>
      </div>

      <AppFooter />
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
