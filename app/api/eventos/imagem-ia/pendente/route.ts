import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// Se uma geração ficou pendente sem a pessoa aprovar/recusar (ex: saiu da
// tela achando que travou, mas a geração terminou depois), esse endpoint
// deixa o componente recuperar ela ao carregar de novo — em vez de perder
// o crédito já cobrado sem nenhuma forma de resolver.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ pending: null })

  const editToken = req.nextUrl.searchParams.get('edit_token')
  const sb = getSupabaseAdmin()

  let eventId: string | null = null
  if (editToken) {
    const { data: evento } = await sb.from('events').select('id, user_id').eq('edit_token', editToken).single()
    if (!evento || evento.user_id !== session.user_id) return NextResponse.json({ pending: null })
    eventId = evento.id
  }

  let query = sb
    .from('ai_image_generations')
    .select('id, url')
    .eq('user_id', session.user_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)

  query = eventId ? query.eq('event_id', eventId) : query.is('event_id', null)

  const { data } = await query.maybeSingle()
  return NextResponse.json({ pending: data ? { generationId: data.id, url: data.url } : null })
}
