import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizePhone } from '@/lib/auth'

const SLIDING_MS = 72 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json()
  if (!phone || !code) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })

  const normalized = normalizePhone(phone)
  const sb = getSupabaseAdmin()

  // Verificar OTP
  const { data: otp } = await sb
    .from('otp_codes')
    .select('id, code, expires_at, used')
    .eq('phone', normalized)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!otp || otp.code !== code.trim())
    return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 401 })

  // Marcar como usado
  await sb.from('otp_codes').update({ used: true }).eq('id', otp.id)

  // Criar ou recuperar usuário
  let userId: string
  let hasEvents = false
  const { data: existing } = await sb.from('users').select('id').eq('phone', normalized).single()

  if (existing) {
    userId = existing.id
    const { count } = await sb
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    hasEvents = (count ?? 0) > 0
  } else {
    const { data: newUser } = await sb.from('users').insert({ phone: normalized }).select('id').single()
    userId = newUser!.id
  }

  // Criar sessão
  const expiresAt = new Date(Date.now() + SLIDING_MS).toISOString()
  const { data: session } = await sb
    .from('sessions')
    .insert({ user_id: userId, expires_at: expiresAt })
    .select('token')
    .single()

  const res = NextResponse.json({ ok: true, hasEvents })
  res.cookies.set('vkv_session', session!.token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   SLIDING_MS / 1000,
    path:     '/',
  })
  return res
}
