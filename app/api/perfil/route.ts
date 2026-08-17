import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { name, bio, vibe, instagram } = await req.json()

  // Update parcial: só grava os campos enviados. `name` é o único que,
  // se enviado, não pode ser vazio — os demais são opcionais mesmo vindo
  // vazios (ex: campos condicionais do /criar que só mandam o que falta).
  const updates: Record<string, string | null> = {}
  if (name !== undefined) {
    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })
    updates.name = name.trim()
  }
  if (bio !== undefined) updates.bio = bio?.trim() || null
  if (vibe !== undefined) updates.vibe = vibe?.trim() || null

  const cleanInstagram: string | null = instagram !== undefined
    ? (instagram?.trim()
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
        .replace(/^@/, '')
        .replace(/\/$/, '') || null)
    : null
  if (instagram !== undefined) updates.instagram = cleanInstagram

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  await getSupabaseAdmin()
    .from('users')
    .update(updates)
    .eq('id', session.user_id)

  return NextResponse.json({ ok: true, instagram: cleanInstagram })
}
