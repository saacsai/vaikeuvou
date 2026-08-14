import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('vkv_session')?.value
  if (token) {
    await getSupabaseAdmin().from('sessions').delete().eq('token', token)
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('vkv_session')
  return res
}
