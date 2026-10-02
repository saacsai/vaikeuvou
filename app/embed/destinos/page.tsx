const WP_BASE = 'https://vaikeuvou.app'
const TAG_SOU_FA = 36 // wp-json/wp/v2/tags → slug "sou-fa", id 36

type WPPost = {
  id: number
  slug: string
  date: string
  link: string
  title: { rendered: string }
  _embedded?: {
    'wp:featuredmedia'?: { source_url: string }[]
  }
}

type DestinoPost = WPPost & { commentCount: number }

async function getDestinos(): Promise<DestinoPost[]> {
  const res = await fetch(
    `${WP_BASE}/wp-json/wp/v2/posts?tags=${TAG_SOU_FA}&_embed&per_page=8&orderby=date&order=desc`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return []
  const posts: WPPost[] = await res.json()

  return Promise.all(posts.map(async p => {
    const cRes = await fetch(`${WP_BASE}/wp-json/wp/v2/comments?post=${p.id}&per_page=1`, {
      next: { revalidate: 3600 },
    })
    const commentCount = Number(cRes.headers.get('X-WP-Total') ?? 0)
    return { ...p, commentCount }
  }))
}

// Widget que roda em <iframe> na sidebar do WordPress — recria o visual do
// widget nativo "Destinos em destaque" (que mistura todos os tipos de post),
// mas filtrado só pra #SouFã (tag id 36), que o widget nativo não permite.
export default async function EmbedDestinosPage() {
  const destinos = await getDestinos()

  return (
    <div className="p-3 space-y-3">
      <div className="border border-gray-200 rounded-xl px-4 py-3">
        <p className="font-bold text-gray-900 text-sm">Destinos em destaque</p>
      </div>

      {destinos.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-6">Nenhum destino em destaque ainda.</p>
      )}

      {destinos.map(p => {
        const img = p._embedded?.['wp:featuredmedia']?.[0]?.source_url

        return (
          <a
            key={p.id}
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-gray-100 rounded-xl bg-white hover:shadow-sm transition-shadow"
          >
            {img && (
              <>
                <div className="relative aspect-[4/3] rounded-t-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative px-3 -mt-8">
                  <div className="bg-white rounded-xl shadow-lg p-3">
                    <p
                      className="font-bold text-gray-900 text-sm leading-snug"
                      dangerouslySetInnerHTML={{ __html: p.title.rendered }}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center justify-between px-3 pt-2 pb-3 text-[11px] text-gray-400">
              <span>
                {new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span>{p.commentCount} {p.commentCount === 1 ? 'Comentário' : 'Comentários'}</span>
            </div>
          </a>
        )
      })}
    </div>
  )
}
