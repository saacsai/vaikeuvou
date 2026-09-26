import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.users.phone !== process.env.ADMIN_PHONE) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { tipo, titulo, ideias_centrais } = await req.json()

  if (!tipo || !['VaikeuFui', 'Tendeu', 'ProntoFalei'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
  }
  if (!titulo?.trim() || !ideias_centrais?.trim()) {
    return NextResponse.json({ error: 'Título e ideias centrais são obrigatórios.' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()
  const { error } = await sb.from('blog_briefs').insert({
    tipo,
    titulo: titulo.trim(),
    ideias_centrais: ideias_centrais.trim(),
    status: 'pendente',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
