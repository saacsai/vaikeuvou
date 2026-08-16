export type EventFormFields = {
  title: string
  event_date: string
  event_time: string
  location: string
  description: string
  max_depth: number
  external_url: string
  external_url_label: string
  video_url: string
  bg_image_url: string
}

export function fmtPreviewDate(date: string, time: string): string {
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  const obj = new Date(y, m - 1, d)
  const days   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${days[obj.getDay()]}, ${d} ${months[m - 1]}${time ? ` às ${time}` : ''}`
}
