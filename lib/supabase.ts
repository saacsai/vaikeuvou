import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function getSupabase() {
  return createClient(url, anon)
}

export function getSupabaseAdmin() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type Event = {
  id: string
  title: string
  slug: string
  event_date: string
  event_date_fim: string | null
  duration_minutes: number | null
  location: string | null
  description: string | null
  bg_image_url: string | null
  external_url: string | null
  external_url_label: string | null
  video_url: string | null
  max_depth: number
  creator_phone: string
  edit_token: string
  created_at: string
  user_id: string | null
  guest_list_unlocked_at: string | null
  date_changes_count: number
  lat: number | null
  lng: number | null
  checkin_reminder_sent_at: string | null
  cidade: string | null
  valor: number | null
  descricao_pacote: string | null
  programacao: string | null
  comissao_percentual: number
  max_parcelas: number
}

export type Rsvp = {
  id: string
  event_id: string
  user_name: string
  user_phone: string
  parent_rsvp_id: string | null
  depth_level: number
  created_at: string
  checked_in_at: string | null
  checkin_lat: number | null
  checkin_lng: number | null
  checkin_verified: boolean
  pago: boolean
  valor_pago: number | null
  foto_url: string | null
  mensagem: string | null
}
