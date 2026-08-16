import Image from 'next/image'
import { ProfilePopover } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'

type Props = {
  title: string
  userName: string | null
  userAvatar: string | null
  children?: React.ReactNode
}

export default function InfoPageShell({ title, userName, userAvatar, children }: Props) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex-1">

        <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1 mb-8">
          <div className="flex items-center justify-between md:contents">
            <a href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="vaikeuvou" width={480} height={108} className="h-[43px] md:h-[47px] w-auto" />
            </a>
            <div className="flex items-center gap-1 md:hidden">
              <ProfilePopover userName={userName} userAvatar={userAvatar} />
            </div>
          </div>

          <div className="flex items-center gap-x-2 flex-wrap md:flex-1">
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <span className="text-brand font-bold text-[25px] whitespace-nowrap">{title}</span>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <ProfilePopover userName={userName} userAvatar={userAvatar} />
          </div>
        </div>

        {children}
      </div>

      <AppFooter />
    </div>
  )
}
