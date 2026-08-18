import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from 'ai'
import { google } from '@ai-sdk/google'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const COST = 3

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { edit_token, prompt, includeAvatar } = await req.json()
  if (!edit_token || !prompt?.trim()) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()
  const { data: evento } = await sb
    .from('events')
    .select('id, title, user_id')
    .eq('edit_token', edit_token)
    .single()

  if (!evento) return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 })
  if (evento.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Esse convite não é seu.' }, { status: 403 })
  }

  // Imagem por IA custa 3 créditos sempre — cada geração, sem exceção
  // (mesma regra de vídeo/foto/data: cobra antes, devolve se algo falhar).
  const { data: debited } = await sb.rpc('debit_user_credits', {
    p_user_id: session.user_id,
    p_amount: COST,
  })
  if (!debited) {
    return NextResponse.json({ error: 'Créditos insuficientes.' }, { status: 402 })
  }

  try {
    // Se a pessoa pediu, usa o avatar dela como referência e vira uma
    // ilustração estilo caricatura (mesmo espírito da capa do "18 anos
    // depois") — em vez de uma cena genérica sem ninguém reconhecível.
    let imagePrompt: string | { images: Uint8Array[]; text: string } =
      `Crie uma imagem de banner para a capa de um convite de evento chamado "${evento.title}". ${prompt.trim()}. Estilo: foto vibrante, cores quentes, formato paisagem, sem nenhum texto, letra ou palavra escrita na imagem.`

    if (includeAvatar) {
      const { data: user } = await sb.from('users').select('avatar_url').eq('id', session.user_id).single()
      if (user?.avatar_url) {
        const avatarRes = await fetch(user.avatar_url)
        if (avatarRes.ok) {
          const avatarBytes = new Uint8Array(await avatarRes.arrayBuffer())
          imagePrompt = {
            images: [avatarBytes],
            text: `Transforme a pessoa desta foto numa ilustração estilo caricatura semi-realista, traço de ilustração digital vibrante, mantendo a semelhança do rosto. Cenário: banner de capa para um convite de evento chamado "${evento.title}". ${prompt.trim()}. Formato paisagem, sem nenhum texto, letra ou palavra escrita na imagem.`,
          }
        }
      }
    }

    const result = await generateImage({
      model: google.image('gemini-3-pro-image-preview'),
      prompt: imagePrompt,
      aspectRatio: '21:9',
    })

    const image = result.image
    const ext   = image.mediaType === 'image/png' ? 'png' : 'jpg'
    const path  = `${evento.id}/ia-${Date.now()}.${ext}`

    const { error: upErr } = await sb.storage
      .from('event-headers')
      .upload(path, image.uint8Array, { contentType: image.mediaType, upsert: true })

    if (upErr) throw new Error(upErr.message)

    const { data: { publicUrl } } = sb.storage.from('event-headers').getPublicUrl(path)

    await sb.from('events').update({ bg_image_url: publicUrl }).eq('id', evento.id)

    await sb.from('credit_transactions').insert({
      user_id: session.user_id,
      amount: -COST,
      type: 'debit',
      reason: `Imagem por IA — ${evento.title}`,
      event_id: evento.id,
    })

    return NextResponse.json({ ok: true, url: publicUrl })
  } catch (err) {
    // Gerou erro na IA ou no upload — devolve o crédito, não cobra por falha.
    await sb.rpc('increment_user_credits', { p_user_id: session.user_id, p_amount: COST })
    const message = err instanceof Error ? err.message : 'Erro ao gerar imagem.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
