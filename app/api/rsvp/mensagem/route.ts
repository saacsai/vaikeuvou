import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { rsvp_id, mensagem } = await req.json()
  if (!rsvp_id) return NextResponse.json({ error: 'rsvp_id obrigatório' }, { status: 400 })

  const texto = (mensagem ?? '').trim().slice(0, 200)

  const sb = getSupabaseAdmin()
  const { data: rsvp } = await sb.from('rsvps').select('id').eq('id', rsvp_id).single()
  if (!rsvp) return NextResponse.json({ error: 'Confirmação não encontrada.' }, { status: 404 })

  const { error } = await sb.from('rsvps').update({ mensagem: texto || null }).eq('id', rsvp_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
