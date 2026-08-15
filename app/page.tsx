import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center px-5 pt-[60px] md:pt-[104px] text-center">

        {/* Marca — ícone + wordmark + "Vamo aí?" já vêm com espaçamento definido nessa peça */}
        <Image
          src="/logo-vertical.png"
          alt="vaikeuvou — Vamo aí?"
          width={261}
          height={223}
          className="w-[165px] md:w-[220px] h-auto mb-6 md:mb-[42px]"
          priority
        />

        <p className="w-full max-w-md text-gray-400 text-[14.7px] md:text-[16.7px] mb-3 md:mb-[24px] leading-snug">
          Balada, festa, show, academia, correr, caminhar, surfar, andar de bike, viajar,
          restaurante, pizza, boteco, cinema, churrasco, tomar uma, o que te der na cabeça
          fazer&hellip;
        </p>
        <p className="w-full max-w-md text-gray-400 text-[14.7px] md:text-[16.7px] mb-6 md:mb-[40px] leading-snug">
          Tudo isso é muito legal!<br />
          Muito mais legal é junto com os amigos!
        </p>

        <p className="w-full max-w-md font-display text-lg md:text-xl font-semibold mb-6 md:mb-[36px]">
          Crie. Convide. Compartilhe. Confirme quem vai.
        </p>

        <Link
          href="/criar"
          className="font-display px-10 py-4 md:py-[18px] rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-lg tracking-wide transition-colors shadow-lg shadow-brand/20"
        >
          CRIAR CONVITE
        </Link>
      </div>

      {/* Rodapé — flex-1 acima empurra isso pra base da viewport (mesmo princípio do Google) */}
      <div className="pb-10 pt-6 px-5 flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span>18 anos depois</span>
          <span>·</span>
          <span>Almoço grátis</span>
          <span>·</span>
          <span>Termos de uso</span>
          <span>·</span>
          <span>Política de privacidade</span>
          <span>·</span>
          <span>Fale conosco</span>
        </div>
        <p className="text-gray-300 text-xs">© 2026 vaikeuvou.app</p>
      </div>
    </div>
  )
}
