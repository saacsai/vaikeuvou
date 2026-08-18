import Image from 'next/image'
import { HEADER_PRESETS, titleToHeader } from '@/lib/headers'
import HeaderImageCropUpload from '@/components/HeaderImageCropUpload'
import AiImageGenerate from '@/components/AiImageGenerate'

type Props = {
  value: string
  onChange: (v: string) => void
  title: string
  /** Só definido no painel — habilita upload imediato (sobe e debita na hora). */
  editToken?: string
  credits?: number
  /** Se a pessoa tem avatar no perfil — habilita a opção de usar como
   * referência na geração por IA (vira ilustração estilo caricatura). */
  hasAvatar?: boolean
  onUploaded?: (v: string) => void
  /** Presente no /criar — convite ainda não existe, upload fica pendente até
   * a criação ser confirmada (cobra 1 crédito junto com a criação). */
  onCropped?: (blob: Blob, previewUrl: string) => void
}

export default function BgSelector({ value, onChange, title, editToken, credits, hasAvatar, onUploaded, onCropped }: Props) {
  const auto = titleToHeader(title.trim() || 'vaikeuvou')
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Imagem do cabeçalho</p>
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onChange('')}
          title="Automático — escolhido a partir do título"
          className={`relative aspect-square rounded-lg overflow-hidden border-2 ${value === '' ? 'border-brand' : 'border-transparent'}`}
        >
          <Image src={auto.src} alt="Automático" fill unoptimized className="object-cover" />
          <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[9px] font-bold uppercase">
            Auto ✓
          </span>
        </button>
        {HEADER_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => onChange(p.src)}
            title={p.label}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 ${value === p.src ? 'border-brand' : 'border-transparent hover:border-gray-200'}`}
          >
            <Image src={p.src} alt={p.label} fill unoptimized className="object-cover" />
          </button>
        ))}

        {editToken ? (
          <AiImageGenerate
            editToken={editToken}
            credits={credits ?? 0}
            onUploaded={onUploaded ?? onChange}
          />
        ) : (
          <div
            title="Imagem gerada por IA — disponível depois de criar o convite, 3 créditos"
            className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-not-allowed"
          >
            <span className="text-base text-gray-400">✨</span>
            <span className="text-[8px] font-bold text-gray-500 uppercase leading-tight text-center px-1">Imagem por IA</span>
            <span className="text-[7px] font-bold text-gray-400 uppercase">Após criar · 3 créditos</span>
          </div>
        )}

        {(editToken || onCropped) && (
          <HeaderImageCropUpload
            editToken={editToken}
            credits={credits ?? 0}
            onUploaded={onUploaded ?? onChange}
            onCropped={onCropped}
          />
        )}
      </div>
    </div>
  )
}
