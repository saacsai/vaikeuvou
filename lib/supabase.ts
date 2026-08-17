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
}

export type Rsvp = {
  id: string
  event_id: string
  user_name: string
  user_phone: string
  parent_rsvp_id: string | null
  depth_level: number
  created_at: string
}
