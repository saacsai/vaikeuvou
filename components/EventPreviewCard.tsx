import Image from 'next/image'
import { titleToHeader } from '@/lib/headers'
import { fmtPreviewDate, type EventFormFields } from '@/lib/eventForm'

type Props = {
  form: EventFormFields
  userName: string | null
  userAvatar: string | null
  userBio?: string | null
  userInstagram?: string | null
}

export default function EventPreviewCard({ form, userName, userAvatar, userBio, userInstagram }: Props) {
  const hasTitle  = form.title.trim().length > 0
  const header    = form.bg_image_url
    ? { src: form.bg_image_url, bg: '#f5f5f4' }
    : titleToHeader(hasTitle ? form.title : 'vaikeuvou')
  const nome      = userName ?? 'Você'
  const iniciais  = nome.slice(0, 2).toUpperCase()
  const dateLabel = fmtPreviewDate(form.event_date, form.event_time)

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-100">
      <div className="relative w-full aspect-[2.4/1]">
        <Image src={header.src} alt="" fill unoptimized className="object-cover" />
      </div>

      <div className="px-5 pt-5 pb-6 bg-gradient-to-b from-white to-[#fcede1]">
        <Image src="/logo.png" alt="vaikeuvou" width={1161} height={201} className="h-7 w-auto mb-0.5" />
        <h1 className={`text-xl font-bold leading-tight mb-3 ${hasTitle ? 'text-gray-900' : 'text-gray-300'}`}>
          {hasTitle ? form.title : 'Nome do evento'}
        </h1>

        <div className="space-y-1 text-xs text-gray-500 mb-4">
          <p>📅 {dateLabel || 'Data e horário'}</p>
          <p>📍 <span className={form.location ? 'text-brand' : ''}>{form.location || 'Local'}</span></p>
          {form.external_url && (
            <p>🔗 <span className="text-brand">{form.external_url_label || 'Saiba mais'}</span></p>
          )}
          {form.description && (
            <p className="text-gray-500 mt-2 leading-relaxed italic">&ldquo;{form.description}&rdquo;</p>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          {userAvatar ? (
            <Image src={userAvatar} alt={nome} width={28} height={28}
              className="w-7 h-7 rounded-full object-cover" unoptimized />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
              {iniciais}
            </div>
          )}
          <p className="text-xs text-gray-400">organizado por <span className="font-semibold text-gray-600">{nome}</span></p>
        </div>

        <p className="text-gray-900 font-semibold text-sm mb-2">Vamo aí?</p>
        <div className="w-full py-3 rounded-lg bg-brand select-none flex items-center justify-center gap-[5px]">
          <span className="text-white font-bold text-base uppercase tracking-wide">BORA</span>
          <Image src="/icone_bora.png" alt="" width={474} height={537} className="h-6 w-auto" />
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-[10px] text-gray-400">Organizado por <span className="font-semibold text-gray-500">{nome}</span></p>
          {userBio && <p className="text-[10px] text-gray-400">{userBio}</p>}
          {userInstagram && (
            <InstagramIcon className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
