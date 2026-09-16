import { getSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ref?: string }> }

// Botão isolado pra colar em iframe (blog/site que já fala do evento).
// De propósito NÃO repete título/data/local — isso já está no texto ao
// redor, seria redundante. Clique sempre abre a página real do evento em
// nova aba (nunca tenta RSVP dentro do iframe — cookie de terceiro
// quebraria em Safari/Chrome).
export default async function EmbedPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { ref }  = await searchParams
  const sb       = getSupabase()

  const { data: evento } = await sb
    .from('events')
    .select('slug, title')
    .eq('slug', slug)
    .single()

  if (!evento) notFound()

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vaikeuvou.app'
  const href = ref ? `${base}/e/${evento.slug}?ref=${ref}` : `${base}/e/${evento.slug}`

  return (
    <div className="p-2">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-4 shadow-lg shadow-brand/20 transition-colors hover:bg-brand-dark"
      >
        <span className="text-lg font-bold uppercase tracking-wide text-white">
          Confirme presença. Vamo aí?
        </span>
        <Image src="/icone_bora.png" alt="" width={474} height={537} className="h-6 w-auto" />
      </a>
    </div>
  )
}
