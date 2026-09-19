import { nanoid } from 'nanoid'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export function generateSlug(title: string): string {
  return `${slugify(title)}-${nanoid(5)}`
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

// Evento com data_fim (multi-dia): sem hora, já que "horário" perde
// sentido quando o evento cobre mais de um dia.
export function fmtDateRange(inicioIso: string, fimDate: string): string {
  const inicio = new Date(inicioIso)
  const fim    = new Date(`${fimDate}T12:00:00-03:00`)
  const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }
  return `${inicio.toLocaleDateString('pt-BR', opts)} a ${fim.toLocaleDateString('pt-BR', opts)}`
}
