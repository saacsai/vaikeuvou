import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title') ?? 'Vai que eu vou?'
  const date     = searchParams.get('date') ?? ''
  const location = searchParams.get('location') ?? ''
  const logoUrl  = `${req.nextUrl.origin}/logo.png`

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px', height: '630px',
          background: 'linear-gradient(135deg, #fffcf8 0%, #fbdcbc 55%, #f8cba1 100%)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif', padding: '60px',
        }}
      >
        {/* Top: logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} width={350} height={79} alt="vaikeuvou" />

        {/* Middle: título */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            fontSize: title.length > 35 ? '60px' : '76px',
            fontWeight: 900, color: '#1a1a1a',
            lineHeight: 1.05, maxWidth: '1000px',
          }}>
            {title}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '28px', color: '#5c4632' }}>
            {date     && <span>📅 {date}</span>}
            {location && <span>📍 {location}</span>}
          </div>
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            background: '#e36811', borderRadius: '16px',
            padding: '20px 56px',
            fontSize: '34px', fontWeight: 700, color: '#ffffff',
            display: 'flex',
          }}>
            Vamo aí?
          </div>
          <div style={{ fontSize: '20px', color: 'rgba(0,0,0,0.35)' }}>
            Clique em BORA para confirmar
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
