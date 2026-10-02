import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession, canAccessPautas } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !canAccessPautas(session.users.phone)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const form           = await req.formData()
  const tipo           = form.get('tipo') as string | null
  const titulo         = form.get('titulo') as string | null
  const ideias_centrais = form.get('ideias_centrais') as string | null
  const imagem         = form.get('imagem') as File | null

  if (!tipo || !['VaikeuFui', 'Tendeu', 'ProntoFalei', 'Revisar', 'SouFa'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
  }
  if (!titulo?.trim() || !ideias_centrais?.trim()) {
    return NextResponse.json({ error: 'Título e ideias centrais são obrigatórios.' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  let imagemUrl: string | null = null
  if (imagem && imagem.size > 0) {
    const path  = `blog-briefs/${Date.now()}-${imagem.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const bytes = await imagem.arrayBuffer()
    const { error: upErr } = await sb.storage
      .from('event-headers')
      .upload(path, bytes, { contentType: imagem.type || 'image/jpeg', upsert: true })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    imagemUrl = sb.storage.from('event-headers').getPublicUrl(path).data.publicUrl
  }

  const { error } = await sb.from('blog_briefs').insert({
    tipo,
    titulo: titulo.trim(),
    ideias_centrais: ideias_centrais.trim(),
    status: 'pendente',
    // Quem mandou — admin vê de todo mundo, editor só enxerga a própria.
    criado_por: session.users.phone,
    imagem_destacada_url: imagemUrl,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
