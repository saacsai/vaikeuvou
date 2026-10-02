const WP_BASE = 'https://vaikeuvou.app'
const TAG_SOU_FA = 36 // wp-json/wp/v2/tags → slug "sou-fa", id 36

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function formatarData(iso: string) {
  const d = new Date(iso)
  return `${MESES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

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
// Layout espelha ref13/ref14: card branco com título+data sobrepondo a base
// da imagem, borda 6px (padrão do tema, não o rounded-xl do Tailwind), data
// no formato "mês dia, ano" (igual ao widget nativo, não é pt-BR padrão) e
// "Comentários" sempre no plural (mesma inconsistência do widget original).
// Sem título próprio — o título "Destinos em destaque" fica a cargo de um
// widget nativo de Heading do WordPress, colocado acima deste na sidebar,
// pra herdar o mesmo estilo (letter-spacing, borda) dos outros títulos do
// site em vez de tentar replicar CSS do tema aqui.
export default async function EmbedDestinosPage() {
  const destinos = await getDestinos()

  return (
    <div className="p-3 space-y-5">
      {destinos.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-6">Nenhum destino em destaque ainda.</p>
      )}

      {destinos.map(p => {
        const img = p._embedded?.['wp:featuredmedia']?.[0]?.source_url

        return (
          <a key={p.id} href={p.link} target="_blank" rel="noopener noreferrer" className="block">
            {img && (
              <div className="relative aspect-[2/1] rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative -mt-10 mx-4 bg-white rounded-md shadow-xl px-4 py-4">
              <p
                className="font-bold text-gray-900 text-base leading-snug"
                dangerouslySetInnerHTML={{ __html: p.title.rendered }}
              />
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                <span>{formatarData(p.date)}</span>
                <span>•</span>
                <span>{p.commentCount} Comentários</span>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}
