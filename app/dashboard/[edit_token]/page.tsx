import { getSupabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { fmtDate } from '@/lib/slug'
import DashboardClient from './DashboardClient'

type Props = { params: Promise<{ edit_token: string }>; searchParams: Promise<{ novo?: string }> }

export default async function DashboardPage({ params, searchParams }: Props) {
  const { edit_token } = await params
  const { novo }       = await searchParams
  const sb             = getSupabaseAdmin()

  const { data: evento } = await sb
    .from('events')
    .select('*')
    .eq('edit_token', edit_token)
    .single()

  if (!evento) notFound()

  const { data: rsvps } = await sb
    .from('rsvps')
    .select('*')
    .eq('event_id', evento.id)
    .order('created_at', { ascending: true })

  return <DashboardClient evento={evento} rsvps={rsvps ?? []} isNovo={novo === '1'} />
}
