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
          className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-not-allowed"
        >
          <span className="text-base text-gray-400">✨</span>
          <span className="text-[8px] font-bold text-gray-500 uppercase leading-tight text-center px-1">Imagem por IA</span>
          <span className="text-[7px] font-bold text-gray-400 uppercase">Em breve</span>
        </div>

        {editToken ? (
          <HeaderImageCropUpload editToken={editToken} credits={credits ?? 0} onUploaded={onUploaded ?? onChange} />
        ) : (
          <div
            title="Enviar sua foto — disponível ao editar o convite"
            className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-not-allowed"
          >
            <CameraIcon className="w-5 h-5 text-gray-300" />
            <span className="text-[8px] font-bold text-gray-500 uppercase leading-tight text-center px-1">Enviar foto</span>
            <span className="text-[7px] font-bold text-gray-400 uppercase">1 crédito</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
