import type { Event } from './supabase'
import { stripMiniMarkup } from './miniMarkup'

type EventoCalendarioBase = Pick<
  Event,
  'title' | 'slug' | 'event_date' | 'event_date_fim' | 'duration_minutes' | 'location' | 'description'
>
type EventoCalendario = EventoCalendarioBase & Pick<Event, 'id'>

const DURACAO_PADRAO_MINUTOS = 180

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// Formato UTC puro (sufixo "Z") — evita ter que declarar VTIMEZONE no ICS,
// cada cliente de calendário já converte pro fuso local sozinho.
function formatIcsUtc(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function dataFimIso(evento: Pick<Event, 'event_date' | 'event_date_fim' | 'duration_minutes'>): string {
  if (evento.event_date_fim) return evento.event_date_fim
  const inicio = new Date(evento.event_date)
  const minutos = evento.duration_minutes ?? DURACAO_PADRAO_MINUTOS
  return new Date(inicio.getTime() + minutos * 60000).toISOString()
}

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://live.vaikeuvou.app'
}

export function gerarIcsContent(evento: EventoCalendario): string {
  const dtStart = formatIcsUtc(evento.event_date)
  const dtEnd = formatIcsUtc(dataFimIso(evento))
  const dtStamp = formatIcsUtc(new Date().toISOString())
  const url = `${siteBase()}/e/${evento.slug}`

  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//vaikeuvou//evento//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${evento.id}@vaikeuvou.app`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(evento.title)}`,
    evento.location ? `LOCATION:${escapeIcsText(evento.location)}` : null,
    `DESCRIPTION:${escapeIcsText(stripMiniMarkup(evento.description || 'Confirmado via vaikeuvou.app'))}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((l): l is string => l !== null)

  return linhas.join('\r\n')
}

export function googleCalendarUrl(evento: EventoCalendarioBase): string {
  const dtStart = formatIcsUtc(evento.event_date)
  const dtEnd = formatIcsUtc(dataFimIso(evento))
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evento.title,
    dates: `${dtStart}/${dtEnd}`,
    details: `${stripMiniMarkup(evento.description || '')}\n\n${siteBase()}/e/${evento.slug}`.trim(),
    location: evento.location || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function icsUrl(slug: string): string {
  return `${siteBase()}/api/eventos/${slug}/ics`
}

// "20 de setembro de 2026 (sábado), 09:30" — formato padrão pra mensagens
// de confirmação por WhatsApp, diferente do fmtDate() usado nas telas.
export function fmtDataConfirmacao(iso: string): string {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  }).formatToParts(new Date(iso))
  const get = (t: string) => partes.find(p => p.type === t)?.value ?? ''
  return `${get('day')} de ${get('month')} de ${get('year')} (${get('weekday')}), ${get('hour')}:${get('minute')}`
}

// Bloco de links de calendário reaproveitado em toda mensagem de
// confirmação por WhatsApp (gratuita ou paga).
export function linksCalendarioTxt(evento: EventoCalendario): string {
  return `📅 Google Calendar: ${googleCalendarUrl(evento)}\n🗓️ Baixar .ics: ${icsUrl(evento.slug)}`
}
