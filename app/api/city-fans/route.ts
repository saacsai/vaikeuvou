import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// Contador de "Tbm sou fã" pro 5º pilar editorial (#SouFã) do blog em
// vaikeuvou.app — um post-âncora por destino, botão liga/desliga por usuário
// logado. Mesma ponte cross-domain do comment-identity: o script do blog
// chama esta rota com credentials:'include', o cookie de sessão viaja por
// SameSite=Lax (mesmo site, subdomínios diferentes).
const ALLOWED_ORIGIN = 'https://vaikeuvou.app'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  }
}

export async function GET(req: NextRequest) {
  const postId = Number(req.nextUrl.searchParams.get('post_id'))
  if (!postId) {
    return NextResponse.json({ error: 'post_id obrigatório' }, { status: 400, headers: corsHeaders() })
  }

  const sb = getSupabaseAdmin()
  const session = await getSession()

  const { count } = await sb
    .from('city_fans')
    .select('id', { count: 'exact', head: true })
    .eq('wp_post_id', postId)

  let souFa: boolean | null = null
  if (session) {
    const { data } = await sb
      .from('city_fans')
      .select('id')
      .eq('wp_post_id', postId)
      .eq('user_id', session.user_id)
      .maybeSingle()
    souFa = !!data
  }

  return NextResponse.json({ count: count ?? 0, souFa }, { headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401, headers: corsHeaders() })
  }

  const { post_id } = await req.json()
  const postId = Number(post_id)
  if (!postId) {
    return NextResponse.json({ error: 'post_id obrigatório' }, { status: 400, headers: corsHeaders() })
  }

  const sb = getSupabaseAdmin()

  const { data: existente } = await sb
    .from('city_fans')
    .select('id')
    .eq('wp_post_id', postId)
    .eq('user_id', session.user_id)
    .maybeSingle()

  if (existente) {
    await sb.from('city_fans').delete().eq('id', existente.id)
  } else {
    await sb.from('city_fans').insert({ user_id: session.user_id, wp_post_id: postId })
  }

  const { count } = await sb
    .from('city_fans')
    .select('id', { count: 'exact', head: true })
    .eq('wp_post_id', postId)

  return NextResponse.json({ count: count ?? 0, souFa: !existente }, { headers: corsHeaders() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() })
}
