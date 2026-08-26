// Presets de imagem de cabeçalho do convite — imagens definitivas do Sandro (duotone laranja
// da marca), entregues em 2026-08-26. Cada `bg` é o tom pastel derivado da própria foto.
export type HeaderPreset = {
  id: string
  label: string
  src: string
  /** tom pastel derivado da imagem, usado como fundo do corpo do card (estilo Google Forms) */
  bg: string
}

export const HEADER_PRESETS: HeaderPreset[] = [
  { id: 'show',             label: 'Show',             src: '/headers/show.jpg',             bg: '#e8e1df' },
  { id: 'futebol',          label: 'Futebol',          src: '/headers/futebol.jpg',          bg: '#f3e7e2' },
  { id: 'aventura',         label: 'Aventura',         src: '/headers/aventura.jpg',         bg: '#f4ebe8' },
  { id: 'reuniao',          label: 'Reunião',          src: '/headers/reuniao.jpg',          bg: '#efe7e4' },
  { id: 'amigos',           label: 'Amigos',           src: '/headers/amigos.jpg',           bg: '#f8ece7' },
  { id: 'confraternizacao', label: 'Confraternização', src: '/headers/confraternizacao.jpg', bg: '#efe8e5' },
  { id: 'bem-estar',        label: 'Bem-estar',        src: '/headers/bem-estar.jpg',        bg: '#f2eae6' },
  { id: 'praia',            label: 'Praia',            src: '/headers/praia.jpg',            bg: '#f0e5e0' },
  { id: 'surf',             label: 'Surf',             src: '/headers/surf.jpg',             bg: '#f6eeeb' },
  { id: 'corrida',          label: 'Corrida',          src: '/headers/corrida.jpg',          bg: '#ebe2df' },
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
