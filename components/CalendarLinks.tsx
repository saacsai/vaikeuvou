import { googleCalendarUrl, icsUrl } from '@/lib/calendar'
import type { Event } from '@/lib/supabase'

type Props = {
  evento: Pick<Event, 'title' | 'slug' | 'event_date' | 'event_date_fim' | 'duration_minutes' | 'location' | 'description'>
}

export default function CalendarLinks({ evento }: Props) {
  return (
    <div className="flex gap-2">
      <a
        href={googleCalendarUrl(evento)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-xs uppercase tracking-wide hover:bg-gray-200"
      >
        📅 Google Calendar
      </a>
      <a
        href={icsUrl(evento.slug)}
        className="flex-1 text-center py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-xs uppercase tracking-wide hover:bg-gray-200"
      >
        🗓️ Baixar .ics
      </a>
    </div>
  )
}
