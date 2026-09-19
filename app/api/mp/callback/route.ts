import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getOAuth } from '@/lib/mercadopago'

export async function GET(req: NextRequest) {
  const base   = process.env.NEXT_PUBLIC_SITE_URL || 'https://live.vaikeuvou.app'
  const code   = req.nextUrl.searchParams.get('code')
  const userId = req.nextUrl.searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.redirect(`${base}/meus-convites?mp_erro=1`)
  }

  let oauth
  try {
    oauth = await getOAuth().create({
      body: {
        client_id:     process.env.MP_CLIENT_ID!,
        client_secret: process.env.MP_CLIENT_SECRET!,
        code,
        redirect_uri:  `${base}/api/mp/callback`,
      },
    })
  } catch (err) {
    console.error('Erro ao trocar code por token MP:', err)
    return NextResponse.redirect(`${base}/meus-convites?mp_erro=1`)
  }

  if (!oauth.access_token) {
    return NextResponse.redirect(`${base}/meus-convites?mp_erro=1`)
  }

  const sb = getSupabaseAdmin()
  await sb
    .from('users')
    .update({
      mp_access_token:  oauth.access_token,
      mp_refresh_token: oauth.refresh_token ?? null,
      mp_user_id:       oauth.user_id ? String(oauth.user_id) : null,
    })
    .eq('id', userId)

  return NextResponse.redirect(`${base}/meus-convites?mp_conectado=1`)
}
