export async function enviarWhatsapp(numero: string, texto: string): Promise<{ ok: boolean; error?: string }> {
  return enviarWhatsappViaInstancia(process.env.EVOLUTION_INSTANCE!, numero, texto)
}

/**
 * Igual a enviarWhatsapp, mas permite escolher a instância — usado pelo
 * monitor de saúde pra alertar por uma instância diferente da que está
 * sendo checada (se a própria instância vaikeuvou caiu, não dá pra avisar
 * por ela mesma).
 */
export async function enviarWhatsappViaInstancia(
  instancia: string,
  numero: string,
  texto: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(instancia)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: process.env.EVOLUTION_API_KEY! },
    body: JSON.stringify({ number: numero, text: texto }),
  })
  if (!res.ok) return { ok: false, error: await res.text() }
  return { ok: true }
}

export async function checarEstadoConexao(instancia: string): Promise<string> {
  const res = await fetch(
    `${process.env.EVOLUTION_API_URL}/instance/connectionState/${encodeURIComponent(instancia)}`,
    { headers: { apikey: process.env.EVOLUTION_API_KEY! } }
  )
  if (!res.ok) return 'erro_api'
  const data = await res.json()
  return data?.instance?.state ?? 'desconhecido'
}
