import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from 'ai'
import { google } from '@ai-sdk/google'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const COST = 3

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { edit_token, title, prompt, includeAvatar, referenceImage } = await req.json()
  // Sem referência, a descrição é obrigatória (é a única coisa que define a
  // cena). Com foto de referência ela é só um extra — a foto já define tudo.
  if (!prompt?.trim() && !referenceImage) {
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
    // Estilo padrão: pintura digital semi-realista, nem foto (fica com
    // "cara de IA": pele lisa demais, luz artificial) nem cartoon de cores
    // chapadas (perde o clima real da cena) — meio-termo validado visualmente
    // com o Luciano, mesmo espírito da capa do "18 anos depois".
    const ESTILO = 'pintura digital semi-realista (digital illustration / concept art), com sombreamento suave, volume e profundidade, textura pintada à mão. NÃO é fotografia (sem textura de câmera real), mas também NÃO é desenho animado de cores chapadas com contornos grossos tipo cartoon infantil — é uma ilustração editorial realista, como capa de revista, com luz e sombra naturais porém claramente pintada à mão'

    let imagePrompt: string | { images: Uint8Array[]; text: string } =
      `Crie uma imagem de banner para a capa de um convite de evento chamado "${eventTitle}". ${prompt.trim()}. Estilo: ${ESTILO}. Formato paisagem, sem nenhum texto, letra ou palavra escrita na imagem.`

    // Referência opcional pra ancorar a geração em algo real — o avatar do
    // perfil ou uma foto que a pessoa envie na hora (do local, do grupo
    // etc.), em vez de uma cena inteiramente inventada. Upload próprio tem
    // prioridade se os dois vierem juntos.
    let referenceBytes: Uint8Array | null = null

    if (typeof referenceImage === 'string') {
      const match = /^data:image\/[a-zA-Z+.-]+;base64,(.+)$/.exec(referenceImage)
      if (match) {
        const buf = Buffer.from(match[1], 'base64')
        if (buf.byteLength <= 8 * 1024 * 1024) referenceBytes = new Uint8Array(buf)
      }
    } else if (includeAvatar && session.users.avatar_url) {
      const avatarRes = await fetch(session.users.avatar_url)
      if (avatarRes.ok) referenceBytes = new Uint8Array(await avatarRes.arrayBuffer())
    }

    if (referenceBytes) {
      // Com foto de referência o modelo tende a ser conservador demais —
      // sai quase igual à foto original, tipo um filtro leve, principalmente
      // em cenas cheias de detalhe repetitivo (banca de feira lotada etc.).
      // Precisa insistir bastante que é repintura completa, não filtro.
      // Mas repintar forte demais também derrapa na identidade de quem
      // está na foto — por isso a fidelidade do rosto é instrução à parte,
      // mais rígida que o resto da cena (validado visualmente: sem essa
      // separação, o rosto saía parecido mas não reconhecível de verdade).
      const instrucaoExtra = prompt?.trim() ? ` Instrução extra do usuário: ${prompt.trim()}.` : ''
      imagePrompt = {
        images: [referenceBytes],
        text: `Reimagine o AMBIENTE, o cenário e os objetos desta imagem como uma ${ESTILO} — REPINTURA COMPLETA do fundo, não um filtro. Simplifique detalhes pequenos e repetitivos do cenário em pinceladas maiores (não precisa pintar cada folha ou cada objeto individualmente).

Mas o ROSTO de cada pessoa em primeiro plano é a parte mais importante: precisa manter MÁXIMA fidelidade às feições reais — mesmo formato de rosto, mesma testa, olhos, sobrancelhas, nariz, boca, barba/bigode, e qualquer marca distintiva da pele (pintas, sinais, rugas características) exatamente como na foto original. Aplique a mesma técnica de pintura no rosto (sombreamento suave, pincelada), mas SEM alterar a identidade — alguém que conhece essa pessoa precisa reconhecê-la instantaneamente, como um retrato pintado ao vivo dela, não uma pessoa parecida.

O resultado deve parecer óbvio e imediatamente uma ilustração pintada, nunca uma foto com filtro. Cenário: banner de capa para um convite de evento chamado "${eventTitle}".${instrucaoExtra} Formato paisagem, sem nenhum texto, letra ou palavra escrita na imagem.`,
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
