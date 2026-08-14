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

  return session as { id: string; token: string; user_id: string; users: { id: string; phone: string; name: string | null; email: string | null; avatar_url: string | null } }
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // Adiciona 55 se não tiver código do país
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return '55' + digits
}
