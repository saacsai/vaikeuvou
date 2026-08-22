import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.users.phone !== process.env.ADMIN_PHONE) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { user_id, amount, reason } = await req.json()
  if (!user_id || !amount || amount <= 0 || !reason?.trim()) {
    return NextResponse.json({ error: 'user_id, amount e reason são obrigatórios.' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  const { error: insErr } = await sb.from('credit_transactions').insert({
    user_id,
    amount,
    type: 'purchase',
    reason: reason.trim(),
  })
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  const { error: rpcErr } = await sb.rpc('increment_user_credits', { p_user_id: user_id, p_amount: amount })
  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
