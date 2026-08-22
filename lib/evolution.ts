export async function enviarWhatsapp(numero: string, texto: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: process.env.EVOLUTION_API_KEY! },
    body: JSON.stringify({ number: numero, text: texto }),
  })
  if (!res.ok) return { ok: false, error: await res.text() }
  return { ok: true }
}
