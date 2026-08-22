import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { enviarWhatsapp } from '@/lib/evolution'

const COOLDOWN_MS = 24 * 60 * 60 * 1000

const AUTOREPLY_TEXT =
  'Esse número é só pra enviar códigos de login do vaikeuvou.app — a gente ainda não consegue responder mensagens por aqui. ' +
  'Se precisar de ajuda, fala com a gente por vaikeuvou.app/fale 🙂'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  // O "apikey" que a Evolution ecoa no corpo é o token da INSTÂNCIA, não a
  // chave global que usamos pra chamar a API dela (e nem sempre vem
  // preenchido, depende de config do servidor) — não dá pra autenticar por
  // ele. Em vez disso, configuramos um header customizado no webhook/set,
  // que a Evolution reenvia como header de verdade na chamada.
  if (req.headers.get('x-evolution-secret') !== process.env.EVOLUTION_API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (body.event !== 'messages.upsert') return NextResponse.json({ ok: true })

  const data = body.data
  const remoteJid: string | undefined = data?.key?.remoteJid
  const fromMe: boolean = !!data?.key?.fromMe

  // Ignora mensagens que a gente mesma envia (ex: o código de OTP — senão
  // vira loop infinito), grupos e status/broadcast.
  if (fromMe || !remoteJid || remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast')) {
    return NextResponse.json({ ok: true })
  }

  const phone = remoteJid.split('@')[0]
  const sb = getSupabaseAdmin()

  const { data: existing } = await sb
    .from('whatsapp_autoreplies')
    .select('last_sent_at')
    .eq('phone', phone)
    .single()

  if (existing && Date.now() - new Date(existing.last_sent_at).getTime() < COOLDOWN_MS) {
    return NextResponse.json({ ok: true, skipped: 'cooldown' })
  }

  await enviarWhatsapp(phone, AUTOREPLY_TEXT)

  await sb.from('whatsapp_autoreplies').upsert({ phone, last_sent_at: new Date().toISOString() })

  return NextResponse.json({ ok: true })
}
