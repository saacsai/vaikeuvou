import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.users.phone !== process.env.ADMIN_PHONE) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { user_id, pode_criar_post } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 })

  const sb = getSupabaseAdmin()
  const { error } = await sb.from('users').update({ pode_criar_post: !!pode_criar_post }).eq('id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
