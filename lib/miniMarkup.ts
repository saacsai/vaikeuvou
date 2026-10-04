// Formatação mínima pra campos de texto livre (O que está incluso,
// Programação, Sobre o organizador) — só negrito/itálico/sublinhado, sem
// aceitar HTML nenhum do usuário (evita XSS: escapa tudo primeiro, só
// depois troca os 3 padrões conhecidos por tag seca).
const MARKERS = {
  bold: '**',
  italic: '_',
  underline: '++',
} as const

export type MiniMarkupMarker = keyof typeof MARKERS

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderMiniMarkup(raw: string): string {
  let html = escapeHtml(raw)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  html = html.replace(/\n/g, '<br />')
  return html
}

// Pra contextos que só aceitam texto puro (descrição de .ics, mensagem de
// WhatsApp) — remove os marcadores em vez de converter pra tag.
export function stripMiniMarkup(raw: string): string {
  return raw
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\+\+([^+]+)\+\+/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
}

// Envolve (ou desenha os marcadores vazios, se nada selecionado) o trecho
// selecionado do textarea com o marcador pedido. Retorna o texto novo e
// onde deve ficar a seleção depois, pra chamar quem usa saber reposicionar
// o cursor/foco.
export function wrapSelection(
  text: string,
  selStart: number,
  selEnd: number,
  marker: MiniMarkupMarker
): { text: string; selStart: number; selEnd: number } {
  const m = MARKERS[marker]
  const before = text.slice(0, selStart)
  const selected = text.slice(selStart, selEnd)
  const after = text.slice(selEnd)

  const novo = `${before}${m}${selected}${m}${after}`
  const novoStart = selStart + m.length
  const novoEnd = novoStart + selected.length

  return { text: novo, selStart: novoStart, selEnd: novoEnd }
}
