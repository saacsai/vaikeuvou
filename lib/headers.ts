// Presets de imagem de cabeçalho do convite — hoje são placeholders de banco de imagem
// gratuito (Picsum) só pra marcar o layout. O Sandro vai entregar as 10 definitivas depois,
// aí é só trocar o `src` de cada item mantendo os mesmos `id`.
export type HeaderPreset = {
  id: string
  label: string
  src: string
  /** tom pastel derivado da imagem, usado como fundo do corpo do card (estilo Google Forms) */
  bg: string
}

export const HEADER_PRESETS: HeaderPreset[] = [
  { id: 'balada',    label: 'Balada',    src: '/headers/balada.jpg',    bg: '#f2f6f7' },
  { id: 'show',      label: 'Show',      src: '/headers/show.jpg',      bg: '#ebedee' },
  { id: 'praia',     label: 'Praia',     src: '/headers/praia.jpg',     bg: '#deeaf2' },
  { id: 'corrida',   label: 'Corrida',   src: '/headers/corrida.jpg',   bg: '#dfe3e6' },
  { id: 'futebol',   label: 'Futebol',   src: '/headers/futebol.jpg',   bg: '#e6e5e3' },
  { id: 'viagem',    label: 'Viagem',    src: '/headers/viagem.jpg',    bg: '#e1eaf2' },
  { id: 'pizza',     label: 'Pizza',     src: '/headers/pizza.jpg',     bg: '#e5dcd5' },
  { id: 'cinema',    label: 'Cinema',    src: '/headers/cinema.jpg',    bg: '#e1e1e0' },
  { id: 'churrasco', label: 'Churrasco', src: '/headers/churrasco.jpg', bg: '#f0eae9' },
  { id: 'bike',      label: 'Bike',      src: '/headers/bike.jpg',      bg: '#ece4e4' },
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
