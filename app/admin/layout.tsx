import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.users.phone !== process.env.ADMIN_PHONE) redirect('/')

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <span className="text-brand font-bold text-[25px]">Admin</span>
          </div>
          <a href="/" className="text-gray-400 text-sm hover:text-gray-600">← vaikeuvou.app</a>
        </div>

        <div className="flex gap-2 border-b border-gray-100">
          <a href="/admin/usuarios" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-brand">Usuários</a>
          <a href="/admin/eventos" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-brand">Eventos</a>
        </div>

        {children}
      </div>
    </div>
  )
}
