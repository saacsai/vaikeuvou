'use client'

type Props = {
  title: string
  message: string
  credits: number
  cost?: number
  onCancel: () => void
  onContinue: () => void
  continuing?: boolean
  continueLabel?: string
  erro?: string
  className?: string
}

export default function CreditLockPanel({
  title, message, credits, cost = 1, onCancel, onContinue,
  continuing, continueLabel = 'Continuar', erro, className = '',
}: Props) {
  const insuficiente = credits < cost

  return (
    <div className={`p-4 bg-amber-50 border-2 border-amber-200 rounded-xl space-y-3 text-center ${className}`}>
      <LockIcon className="w-5 h-5 text-amber-500 mx-auto" />
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-500">{message}</p>
      {insuficiente && (
        <p className="text-xs text-red-500 font-semibold">Saldo insuficiente.</p>
      )}
      {erro && <p className="text-xs text-red-500 font-semibold">{erro}</p>}
      <p className="text-[10px] text-gray-400">
        Dúvidas? Acesse <a href="/como-funciona" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Como funciona?</a>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wide hover:bg-gray-50"
        >
          Cancelar
        </button>
        {insuficiente ? (
          <a
            href="/creditos"
            className="flex-1 py-2 rounded-lg bg-brand hover:bg-brand-dark text-white font-bold text-xs uppercase tracking-wide text-center"
          >
            Comprar créditos
          </a>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            disabled={continuing}
            className="flex-1 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wide"
          >
            {continuing ? 'Aguarde…' : continueLabel}
          </button>
        )}
      </div>
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
