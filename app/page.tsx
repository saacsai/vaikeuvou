import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-5 text-center">
      <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-6">vaikeuvou.app</p>
      <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-4">
        Vai que<br />eu vou.
      </h1>
      <p className="text-gray-400 text-lg max-w-sm mb-3">
        Crie um convite em segundos.<br />
        Compartilhe no WhatsApp.<br />
        Veja quem vai.
      </p>
      <p className="text-gray-600 text-sm mb-10">Sem app. Sem cadastro. Sem senha.</p>
      <Link
        href="/criar"
        className="px-10 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xl transition-colors shadow-lg shadow-violet-500/20"
      >
        Criar meu evento 🎉
      </Link>
      <p className="text-gray-700 text-xs mt-8">© 2026 vaikeuvou.app</p>
    </div>
  )
}
