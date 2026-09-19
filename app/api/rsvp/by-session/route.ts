import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Depois do redirect de volta do Stripe Checkout, o webhook pode ainda não ter
// processado — o cliente faz polling curto nesse endpoint até o RSVP aparecer.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 })

  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('rsvps')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  return NextResponse.json({ rsvp_id: data?.id ?? null })
}
