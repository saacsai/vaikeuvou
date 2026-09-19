import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizePhone } from '@/lib/auth'

// Depois do redirect de volta do Mercado Pago, o webhook pode ainda não ter
// processado — o cliente faz polling curto nesse endpoint até o RSVP aparecer.
// Não dependemos de um id específico devolvido pelo MP na URL de retorno —
// event_id + telefone já são únicos por confirmação paga.
export async function GET(req: NextRequest) {
  const eventId  = req.nextUrl.searchParams.get('event_id')
  const telefone = req.nextUrl.searchParams.get('telefone')
  if (!eventId || !telefone) return NextResponse.json({ error: 'event_id e telefone obrigatórios' }, { status: 400 })

  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('rsvps')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_phone', normalizePhone(telefone))
    .eq('pago', true)
    .maybeSingle()

  return NextResponse.json({ rsvp_id: data?.id ?? null })
}
