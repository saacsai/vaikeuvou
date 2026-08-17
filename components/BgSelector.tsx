import Image from 'next/image'
import { HEADER_PRESETS, titleToHeader } from '@/lib/headers'
import HeaderImageCropUpload from '@/components/HeaderImageCropUpload'

type Props = {
  value: string
  onChange: (v: string) => void
  title: string
  /** Só definido no painel — habilita upload imediato (sobe e debita na hora). */
  editToken?: string
  /** Valor salvo do convite (não o do form em edição) — se já contém uma foto
   * própria, trocar custa 1 crédito; senão a próxima foto é grátis. No /criar
   * sempre vazio, então a primeira foto de um convite novo é sempre grátis. */
  currentValue?: string
  credits?: number
  onUploaded?: (v: string, charged: boolean) => void
  /** Presente no /criar — convite ainda não existe, upload fica pendente até
   * a criação ser confirmada (sempre grátis nesse caso, é a primeira foto). */
  onCropped?: (blob: Blob, previewUrl: string) => void
}

export default function BgSelector({ value, onChange, title, editToken, currentValue, credits, onUploaded, onCropped }: Props) {
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

        <div
          title="Imagem gerada por IA — em breve"
          className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-not-allowed"
        >
          <span className="text-base text-gray-400">✨</span>
          <span className="text-[8px] font-bold text-gray-500 uppercase leading-tight text-center px-1">Imagem por IA</span>
          <span className="text-[7px] font-bold text-gray-400 uppercase">Em breve</span>
        </div>

        {(editToken || onCropped) && (
          <HeaderImageCropUpload
            editToken={editToken}
            currentValue={currentValue ?? ''}
            credits={credits ?? 0}
            onUploaded={onUploaded ?? onChange}
            onCropped={onCropped}
          />
        )}
      </div>
    </div>
  )
}
