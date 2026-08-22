import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizePhone } from '@/lib/auth'
import { enviarWhatsapp } from '@/lib/evolution'

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return NextResponse.json({ error: 'Telefone obrigatório.' }, { status: 400 })

  const normalized = normalizePhone(phone)
  if (normalized.length < 12 || normalized.length > 13)
    return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 })

  const sb = getSupabaseAdmin()

  // Rate limit: só 1 OTP por minuto por telefone
  const { data: recent } = await sb
    .from('otp_codes')
    .select('created_at')
    .eq('phone', normalized)
    .gt('created_at', new Date(Date.now() - 60_000).toISOString())
    .limit(1)
    .single()

  if (recent) return NextResponse.json({ error: 'Aguarde 1 minuto para reenviar.' }, { status: 429 })

  const code    = String(Math.floor(100000 + Math.random() * 900000))
  const expires = new Date(Date.now() + 5 * 60_000).toISOString()

  await sb.from('otp_codes').insert({ phone: normalized, code, expires_at: expires })

  const envio = await enviarWhatsapp(normalized, `Seu código vaikeuvou.app: *${code}*\nVálido por 5 minutos.`)
  if (!envio.ok) {
    console.error('Evolution error:', envio.error)
    return NextResponse.json({ error: 'Erro ao enviar WhatsApp. Tente novamente.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
