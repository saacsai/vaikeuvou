export function titleToGradient(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i)
    hash = hash & hash
  }
  const h  = Math.abs(hash) % 360
  const h2 = (h + 45) % 360
  const h3 = (h + 90) % 360
  return `linear-gradient(135deg, hsl(${h},65%,18%) 0%, hsl(${h2},55%,12%) 50%, hsl(${h3},45%,8%) 100%)`
}

// Cor vibrante para o texto e detalhes (complementar ao BG)
export function titleToAccent(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i)
    hash = hash & hash
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 80%, 75%)`
}
