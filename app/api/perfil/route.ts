import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })

  await getSupabaseAdmin()
    .from('users')
    .update({ name: name.trim() })
    .eq('id', session.user_id)

  return NextResponse.json({ ok: true })
}
