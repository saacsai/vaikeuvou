// Presets de imagem de cabeçalho do convite. Trocadas em 2026-09-26 — as fotos antigas do
// Sandro tinham um duotone laranja aplicado; substituídas por fotos limpas, sem filtro (exceto
// "corrida", que ficou com o filtro laranja por não ter original limpo disponível — pendência
// conhecida, trocar quando tiver a foto certa). Cada `bg` é o tom pastel derivado da própria foto.
export type HeaderPreset = {
  id: string
  label: string
  src: string
  /** tom pastel derivado da imagem, usado como fundo do corpo do card (estilo Google Forms) */
  bg: string
}

export const HEADER_PRESETS: HeaderPreset[] = [
  { id: 'show',             label: 'Show',             src: '/headers/show.jpg',             bg: '#e1dbdc' },
  { id: 'futebol',          label: 'Futebol',          src: '/headers/futebol.jpg',          bg: '#ebe9e0' },
  { id: 'aventura',         label: 'Aventura',         src: '/headers/aventura.jpg',         bg: '#ebebea' },
  { id: 'reuniao',          label: 'Reunião',          src: '/headers/reuniao.jpg',          bg: '#e6e5e3' },
  { id: 'amigos',           label: 'Amigos',           src: '/headers/amigos.jpg',           bg: '#ecedee' },
  { id: 'confraternizacao', label: 'Confraternização', src: '/headers/confraternizacao.jpg', bg: '#e5e5e6' },
  { id: 'bem-estar',        label: 'Bem-estar',        src: '/headers/bem-estar.jpg',        bg: '#eae9e7' },
  { id: 'praia',            label: 'Praia',            src: '/headers/praia.jpg',            bg: '#e7e4e1' },
  { id: 'surf',             label: 'Surf',             src: '/headers/surf.jpg',             bg: '#efeded' },
  { id: 'corrida',          label: 'Corrida',          src: '/headers/corrida.jpg',          bg: '#e7ddd8' },
]

/** Seleção automática determinística por título — mesma lógica do titleToGradient antigo. */
export function titleToHeader(title: string): HeaderPreset {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i)
    hash = hash & hash
  }
  const idx = Math.abs(hash) % HEADER_PRESETS.length
  return HEADER_PRESETS[idx]
}
