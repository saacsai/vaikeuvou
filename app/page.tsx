import Image from 'next/image'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { ProfilePopover } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'

export default async function Home() {
  const session = await getSession()

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {session && (
        <div className="flex items-center justify-end gap-1 px-5 pt-4">
          <ProfilePopover userName={session.users.name} userAvatar={session.users.avatar_url} userCredits={session.users.credits} />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-5 pt-[60px] md:pt-0 md:justify-center text-center">

        {/* Marca — ícone + wordmark + "Vamo aí?" já vêm com espaçamento definido nessa peça */}
        <Image
          src="/logo-vertical.png"
          alt="vaikeuvou — Vamo aí?"
          width={261}
          height={223}
          className="w-[220px] md:w-[250px] h-auto mb-6 md:mb-[42px]"
          priority
        />

        <p className="w-full max-w-md text-gray-400 text-[14.7px] md:text-[16.7px] mb-3 md:mb-[24px] leading-snug">
          Balada, festa, show, academia, correr, caminhar, surfar, andar de bike, bater uma
          bola, viajar, restaurante, pizza, boteco, cinema, teatro, churrasco, tomar uma,
          trocar ideia&hellip;
        </p>
        <p className="w-full max-w-md text-gray-400 text-[14.7px] md:text-[16.7px] mb-6 md:mb-[40px] leading-snug">
          Fazer tudo isso é muito legal! Mas, fala a verdade, junto com a galera, junto com
          os amigos, é muito melhor!
        </p>

        <p className="w-full max-w-md text-[14.7px] md:text-[16.7px] font-semibold mb-6 md:mb-[36px]">
          Crie. Convide. Compartilhe. Confirme quem vai.
        </p>

        <Link
          href="/criar"
          className="px-[27px] py-4 md:py-[18px] rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-lg tracking-wide transition-colors shadow-lg shadow-brand/20"
        >
          CRIAR CONVITE
        </Link>
      </div>

      <AppFooter />
    </div>
  )
}
