import { cookies } from 'next/headers'
import { getSupabaseAdmin } from './supabase'

const SESSION_COOKIE = 'vkv_session'
const SLIDING_MS     = 72 * 60 * 60 * 1000 // 72h

export async function getSession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const sb = getSupabaseAdmin()
  const { data: session } = await sb
    .from('sessions')
    .select('*, users(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!session) return null

  // Sliding expiry: renew on every access
  await sb
    .from('sessions')
    .update({ expires_at: new Date(Date.now() + SLIDING_MS).toISOString() })
    .eq('token', token)

  return session as { id: string; token: string; user_id: string; users: { id: string; phone: string; name: string | null; email: string | null; avatar_url: string | null; bio: string | null; vibe: string | null; instagram: string | null; credits: number; terms_accepted_at: string | null; mp_access_token: string | null; mp_refresh_token: string | null; mp_user_id: string | null; comissao_percentual: number | null; pode_criar_post: boolean } }
}

export function isAdminPhone(phone: string | null | undefined): boolean {
  return !!phone && phone === process.env.ADMIN_PHONE
}

type PautasUser = { phone?: string | null; pode_criar_post?: boolean | null } | null | undefined

// Admin sempre pode; além dele, quem tem `pode_criar_post` habilitado em
// /admin/usuarios (toggle do admin) ou está na lista fixa EDITOR_PHONES
// (fallback antigo, ex: Sandro, antes do toggle existir) — não dá acesso ao
// resto do /admin (Usuários/Eventos), só a /admin/pautas, e só enxerga as
// próprias.
export function canAccessPautas(user: PautasUser): boolean {
  if (!user) return false
  if (isAdminPhone(user.phone)) return true
  if (user.pode_criar_post) return true
  const editores = (process.env.EDITOR_PHONES ?? '').split(',').map(p => p.trim()).filter(Boolean)
  return !!user.phone && editores.includes(user.phone)
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // Adiciona 55 se não tiver código do país
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return '55' + digits
}
