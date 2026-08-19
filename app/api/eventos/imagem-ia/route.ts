import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from 'ai'
import { google } from '@ai-sdk/google'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const COST = 3

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { edit_token, title, prompt, includeAvatar } = await req.json()
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  const sb = getSupabaseAdmin()

  // Convite pode já existir (painel) ou ainda não (/criar) — nos dois casos
  // a cobrança acontece na hora da geração, mas só vira capa de verdade
  // quando aprovada (ver /aprovar e /recusar).
  let eventId: string | null = null
  let eventTitle = (title as string | undefined)?.trim() || 'vaikeuvou'

  if (edit_token) {
    const { data: evento } = await sb
      .from('events')
      .select('id, title, user_id')
      .eq('edit_token', edit_token)
      .single()

    if (!evento) return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 })
    if (evento.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Esse convite não é seu.' }, { status: 403 })
    }
    eventId = evento.id
    eventTitle = evento.title
  }

  const { data: debited } = await sb.rpc('debit_user_credits', {
    p_user_id: session.user_id,
    p_amount: COST,
  })
  if (!debited) {
    return NextResponse.json({ error: 'Créditos insuficientes.' }, { status: 402 })
  }

  try {
    // Sempre ilustração desenhada, nunca tentando parecer foto real — é o
    // estilo fotorrealista de IA que fica com a "cara de IA" (pele lisa
    // demais, luz artificial, composição esquisita). Se a pessoa pediu,
    // usa o avatar dela como referência e vira uma caricatura (mesmo
    // espírito da capa do "18 anos depois") em vez de uma cena genérica.
    let imagePrompt: string | { images: Uint8Array[]; text: string } =
      `Crie uma imagem de banner para a capa de um convite de evento chamado "${eventTitle}". ${prompt.trim()}. Estilo: ilustração vetorial plana (flat illustration), traço de cartoon editorial, cores chapadas e vibrantes, contornos definidos, SEM textura de foto, SEM iluminação fotorrealista, SEM pele ou materiais realistas — como uma ilustração de revista ou app, nunca uma fotografia. Formato paisagem, sem nenhum texto, letra ou palavra escrita na imagem.`

    if (includeAvatar && session.users.avatar_url) {
      const avatarRes = await fetch(session.users.avatar_url)
      if (avatarRes.ok) {
        const avatarBytes = new Uint8Array(await avatarRes.arrayBuffer())
        imagePrompt = {
          images: [avatarBytes],
          text: `Transforme a pessoa desta foto numa ilustração vetorial plana (flat illustration), traço de cartoon editorial, cores chapadas, contornos definidos, mantendo a semelhança do rosto — SEM textura de foto, SEM iluminação fotorrealista, SEM pele realista, nunca parecendo uma fotografia. Cenário: banner de capa para um convite de evento chamado "${eventTitle}". ${prompt.trim()}. Formato paisagem, sem nenhum texto, letra ou palavra escrita na imagem.`,
        }
      }
    }

    const result = await generateImage({
      model: google.image('gemini-3-pro-image-preview'),
      prompt: imagePrompt,
      aspectRatio: '21:9',
    })

    const image = result.image
    const ext    = image.mediaType === 'image/png' ? 'png' : 'jpg'
    const folder = eventId ?? `pending/${session.user_id}`
    const path   = `${folder}/ia-${Date.now()}.${ext}`

    const { error: upErr } = await sb.storage
      .from('event-headers')
      .upload(path, image.uint8Array, { contentType: image.mediaType, upsert: true })

    if (upErr) throw new Error(upErr.message)

    const { data: { publicUrl } } = sb.storage.from('event-headers').getPublicUrl(path)

    // Fica "pending" até a pessoa aprovar ou recusar — só nesse momento a
    // imagem vira (ou não) a capa de verdade do convite.
    const { data: generation, error: genErr } = await sb
      .from('ai_image_generations')
      .insert({
        user_id: session.user_id,
        event_id: eventId,
        url: publicUrl,
        storage_path: path,
      })
      .select('id')
      .single()

    if (genErr || !generation) throw new Error(genErr?.message ?? 'Erro ao registrar geração.')

    await sb.from('credit_transactions').insert({
      user_id: session.user_id,
      amount: -COST,
      type: 'debit',
      reason: `Imagem por IA — ${eventTitle}`,
      event_id: eventId,
    })

    return NextResponse.json({ ok: true, url: publicUrl, generationId: generation.id })
  } catch (err) {
    // Gerou erro na IA ou no upload — devolve o crédito, não cobra por falha.
    await sb.rpc('increment_user_credits', { p_user_id: session.user_id, p_amount: COST })
    const message = err instanceof Error ? err.message : 'Erro ao gerar imagem.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
