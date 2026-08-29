import { NextRequest, NextResponse } from 'next/server'
import { checarEstadoConexao, enviarWhatsappViaInstancia } from '@/lib/evolution'

// Instância separada só pra mandar o alerta — se a própria vaikeuvou caiu,
// não dá pra avisar por ela mesma.
const ALERT_INSTANCE = 'Bia fazdireito.ai'
const ALERT_NUMBER = '5511964480411'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const estado = await checarEstadoConexao(process.env.EVOLUTION_INSTANCE!)

  if (estado !== 'open') {
    await enviarWhatsappViaInstancia(
      ALERT_INSTANCE,
      ALERT_NUMBER,
      `⚠️ Instância WhatsApp do vaikeuvou está desconectada (estado: ${estado}).\nProvavelmente o celular ficou sem carga/internet. Reconectar via QR na Evolution.`
    )
  }

  return NextResponse.json({ ok: true, estado })
}
