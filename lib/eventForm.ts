export type EventFormFields = {
  title: string
  event_date: string
  event_time: string
  duration_minutes: number | ''
  location: string
  description: string
  max_depth: number
  external_url: string
  external_url_label: string
  video_url: string
  bg_image_url: string
}

export const DURACAO_OPCOES = [
  { label: '1 hora',           value: 60 },
  { label: '2 horas',          value: 120 },
  { label: '3 horas',          value: 180 },
  { label: 'Período da manhã (4 horas)', value: 240 },
  { label: 'Período da tarde (4 horas)', value: 240 },
  { label: 'Período da noite (4 horas)', value: 240 },
  { label: 'Dia inteiro (8 horas)',      value: 480 },
]

export function fmtPreviewDate(date: string, time: string, durationMinutes?: number | ''): string {
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  const obj = new Date(y, m - 1, d)
  const days   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  let horaLabel = time ? ` às ${time}` : ''
  if (time && durationMinutes) {
    const [h, min] = time.split(':').map(Number)
    const fim = new Date(0, 0, 0, h, min + durationMinutes)
    const fimStr = `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`
    horaLabel = ` das ${time} às ${fimStr}`
  }

  return `${days[obj.getDay()]}, ${d} ${months[m - 1]}${horaLabel}`
}
