import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getOAuth } from '@/lib/mercadopago'

// Conecta a conta Mercado Pago do organizador — necessário pra receber
// split (o dinheiro cai direto na conta dele, não na do vaikeuvou).
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL('/login?next=/api/mp/conectar', req.url))

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://live.vaikeuvou.app'
  const url = getOAuth().getAuthorizationURL({
    options: {
      client_id: process.env.MP_CLIENT_ID!,
      redirect_uri: `${base}/api/mp/callback`,
      state: session.user_id,
    },
  })

  return NextResponse.redirect(url)
}
