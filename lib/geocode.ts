// Geocodificação best-effort via Nominatim (OpenStreetMap, gratuito, sem
// API key) — usada só pra validar proximidade no check-in, com raio de
// tolerância generoso (ver app/api/checkin/[rsvp_id]/route.ts), então a
// precisão do Nominatim é suficiente. Nunca lança: falha vira null.
export async function geocodeAddress(endereco: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = endereco.trim()
  if (!trimmed) return null

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'vaikeuvou.app (contato: fale@vaikeuvou.app)' } })
    if (!res.ok) return null

    const data = await res.json()
    const first = Array.isArray(data) ? data[0] : null
    if (!first?.lat || !first?.lon) return null

    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
  } catch {
    return null
  }
}
