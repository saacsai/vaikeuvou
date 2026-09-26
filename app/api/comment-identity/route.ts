import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Ponte de identidade pro sistema de comentários do WordPress (blog em
// vaikeuvou.app). O cookie de sessão (`vkv_session`) fica preso a
// live.vaikeuvou.app — o WordPress não consegue lê-lo direto, então o script
// do blog chama esta rota (mesmo site, cookie viaja por SameSite=Lax) pra
// saber quem está logado e pré-preencher o formulário de comentário nativo.
//
// É uma ponte de conveniência, não uma verificação criptográfica — comentário
// de blog não é superfície de alto risco, e o próprio WordPress já aceita
// nome/e-mail digitados sem verificar nada hoje.
const ALLOWED_ORIGIN = 'https://vaikeuvou.app'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
  }
}

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ logado: false }, { headers: corsHeaders() })
  }

  return NextResponse.json(
    {
      logado: true,
      nome: session.users.name ?? 'Alguém do vaikeuvou',
      foto: session.users.avatar_url ?? null,
      // E-mail sintético e estável: login é por WhatsApp, nem todo mundo tem
      // e-mail cadastrado, e não queremos vazar telefone real no comentário.
      email: `u-${session.user_id}@vaikeuvou.app`,
    },
    { headers: corsHeaders() }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() })
}
