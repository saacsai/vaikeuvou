import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { gerarIcsContent } from '@/lib/calendar'

type Props = { params: Promise<{ slug: string }> }

export async function GET(req: NextRequest, { params }: Props) {
  const { slug } = await params
  const sb = getSupabase()

  const { data: evento } = await sb
    .from('events')
    .select('id, title, slug, event_date, event_date_fim, duration_minutes, location, description')
    .eq('slug', slug)
    .single()

  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

  const ics = gerarIcsContent(evento)

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${evento.slug}.ics"`,
    },
  })
}
