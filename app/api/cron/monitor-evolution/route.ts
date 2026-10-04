import { NextRequest, NextResponse } from 'next/server'
import { checarEstadoConexao } from '@/lib/evolution'
import { enviarEmail } from '@/lib/email'

// Alerta por email em vez de WhatsApp de outra instância — se a própria
// vaikeuvou caiu, não dá pra avisar por WhatsApp mesmo (e depender de uma
// instância de OUTRO produto pra avisar já causou um alerta silenciosamente
// perdido quando aquela instância também caiu, 2026-10-04).
const ALERT_EMAIL = process.env.ADMIN_EMAIL || 'luciano.maeda@saacs.com.br'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const estado = await checarEstadoConexao(process.env.EVOLUTION_INSTANCE!)

  let alerta: { ok: boolean; error?: string } | null = null
  if (estado !== 'open') {
    alerta = await enviarEmail(
      ALERT_EMAIL,
      '⚠️ WhatsApp do vaikeuvou desconectou',
      `A instância WhatsApp do vaikeuvou está desconectada (estado: ${estado}).\n\nProvavelmente o celular ficou sem carga/internet. Reconectar via QR na Evolution.`
    )
    if (!alerta.ok) {
      console.error('Falha ao enviar alerta de desconexão por email:', alerta.error)
    }
  }

  return NextResponse.json({ ok: true, estado, alertaEnviado: alerta?.ok ?? null })
}
