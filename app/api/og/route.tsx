import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

function titleToColors(title: string): [string, string, string] {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i)
    hash = hash & hash
  }
  const h  = Math.abs(hash) % 360
  const h2 = (h + 45) % 360
  const h3 = (h + 90) % 360
  return [
    `hsl(${h},65%,18%)`,
    `hsl(${h2},55%,12%)`,
    `hsl(${h3},45%,8%)`,
  ]
}

function titleToAccent(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i)
    hash = hash & hash
  }
  return `hsl(${Math.abs(hash) % 360},80%,75%)`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title') ?? 'Vai que eu vou?'
  const date     = searchParams.get('date') ?? ''
  const location = searchParams.get('location') ?? ''

  const [c1, c2, c3] = titleToColors(title)
  const accent        = titleToAccent(title)

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px', height: '630px',
          background: `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif', padding: '60px',
        }}
      >
        {/* Top: confirmados placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', color: accent, fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase' }}>
            vaikeuvou.app
          </span>
        </div>

        {/* Middle: título */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            fontSize: title.length > 35 ? '60px' : '76px',
            fontWeight: 900, color: '#ffffff',
            lineHeight: 1.05, maxWidth: '900px',
          }}>
            {title}
          </div>

          <div style={{ display: 'flex', gap: '28px', fontSize: '30px', color: accent }}>
            {date     && <span>📅 {date}</span>}
            {location && <span>📍 {location}</span>}
          </div>
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            background: accent, borderRadius: '20px',
            padding: '18px 48px',
            fontSize: '32px', fontWeight: 800, color: '#111',
            display: 'flex',
          }}>
            E aí? Vamos? 🚀
          </div>
          <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)' }}>
            Clique em BORA para confirmar
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
