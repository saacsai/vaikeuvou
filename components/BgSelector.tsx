import Image from 'next/image'
import { HEADER_PRESETS, titleToHeader } from '@/lib/headers'
import HeaderImageCropUpload from '@/components/HeaderImageCropUpload'

type Props = {
  value: string
  onChange: (v: string) => void
  title: string
  /** Só definido no painel (editando um convite já existente) — habilita o upload real de imagem própria (1 crédito/troca). No /criar fica desabilitado, pois ainda não existe convite pra vincular. */
  editToken?: string
  credits?: number
  /** Chamado quando um upload pago é confirmado — separado do onChange dos presets grátis porque, no painel, precisa também sincronizar o estado "initial" do form (o upload já salva sozinho, não fica pendente de "Salvar alterações"). */
  onUploaded?: (v: string) => void
}

export default function BgSelector({ value, onChange, title, editToken, credits, onUploaded }: Props) {
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
          className="aspect-square rounded-lg bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-0.5 cursor-not-allowed"
        >
          <span className="text-sm text-gray-400 font-bold">✨</span>
          <span className="text-[7px] text-gray-400 font-bold uppercase">Em breve</span>
        </div>

        {editToken ? (
          <HeaderImageCropUpload editToken={editToken} credits={credits ?? 0} onUploaded={onUploaded ?? onChange} />
        ) : (
          <div
            title="Upload de imagem própria — disponível ao editar o convite"
            className="aspect-square rounded-lg bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-0.5 cursor-not-allowed"
          >
            <span className="text-sm text-gray-400 font-bold">↑</span>
            <span className="text-[7px] text-gray-400 font-bold uppercase">1 crédito</span>
          </div>
        )}
      </div>
    </div>
  )
}
