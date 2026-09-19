export type EventFormFields = {
  title: string
  event_date: string
  event_date_fim: string
  event_time: string
  duration_minutes: number | ''
  location: string
  description: string
  max_depth: number
  external_url: string
  external_url_label: string
  video_url: string
  bg_image_url: string
  cidade: string
  valor: number | ''
  descricao_pacote: string
  programacao: string
  max_parcelas: number
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

const DIAS_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmtDiaMes(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const obj = new Date(y, m - 1, d)
  return `${DIAS_ABREV[obj.getDay()]}, ${d} ${MESES_ABREV[m - 1]}`
}

export function fmtPreviewDate(date: string, time: string, durationMinutes?: number | '', dateFim?: string): string {
  if (!date) return ''

  if (dateFim && dateFim !== date) {
    return `${fmtDiaMes(date)} a ${fmtDiaMes(dateFim)}`
  }

  let horaLabel = time ? ` às ${time}` : ''
  if (time && durationMinutes) {
    const [h, min] = time.split(':').map(Number)
    const fim = new Date(0, 0, 0, h, min + durationMinutes)
    const fimStr = `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`
    horaLabel = ` das ${time} às ${fimStr}`
  }

  return `${fmtDiaMes(date)}${horaLabel}`
}
