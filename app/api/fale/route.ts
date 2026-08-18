import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const ASSUNTOS = ['Dúvidas/sugestões', 'Reclamações', 'Cancelamento de conta', 'Parcerias', 'Outros']

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json()

  if (!name?.trim() || !email?.trim() || !subject || !message?.trim()) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
  }
  if (!ASSUNTOS.includes(subject)) {
    return NextResponse.json({ error: 'Assunto inválido.' }, { status: 400 })
  }

  const session = await getSession()

  await getSupabaseAdmin().from('contact_messages').insert({
    name: name.trim(),
    email: email.trim(),
    subject,
    message: message.trim(),
    user_id: session?.user_id ?? null,
  })

  return NextResponse.json({ ok: true })
}
