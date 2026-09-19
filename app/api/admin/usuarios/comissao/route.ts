import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.users.phone !== process.env.ADMIN_PHONE) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { user_id, comissao_percentual } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 })

  // null limpa a customização e volta pro padrão de 15% (ver app/api/eventos).
  const valor = comissao_percentual === null || comissao_percentual === ''
    ? null
    : Number(comissao_percentual)

  const sb = getSupabaseAdmin()
  const { error } = await sb.from('users').update({ comissao_percentual: valor }).eq('id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
