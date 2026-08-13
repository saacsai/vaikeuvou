import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title') ?? 'Vai que eu vou?'
  const date     = searchParams.get('date') ?? ''
  const location = searchParams.get('location') ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px', height: '630px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif', padding: '60px',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '28px', color: '#a78bfa', fontWeight: 700, letterSpacing: '-0.5px' }}>
            vaikeuvou.app
          </span>
        </div>

        {/* Emoji */}
        <div style={{ fontSize: '72px', marginBottom: '24px', display: 'flex' }}>🎉</div>

        {/* Título do evento */}
        <div style={{
          fontSize: title.length > 40 ? '52px' : '64px',
          fontWeight: 800, color: '#ffffff',
          textAlign: 'center', lineHeight: 1.1,
          maxWidth: '900px', marginBottom: '24px',
        }}>
          {title}
        </div>

        {/* Data e local */}
        {(date || location) && (
          <div style={{
            display: 'flex', gap: '24px',
            fontSize: '28px', color: '#c4b5fd',
            textAlign: 'center',
          }}>
            {date && <span>📅 {date}</span>}
            {location && <span>📍 {location}</span>}
          </div>
        )}

        {/* CTA */}
        <div style={{
          position: 'absolute', bottom: '48px',
          background: '#7c3aed', borderRadius: '16px',
          padding: '16px 40px',
          fontSize: '28px', fontWeight: 700, color: '#ffffff',
          display: 'flex',
        }}>
          Clique em BORA 👆
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
