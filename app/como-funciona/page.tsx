import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'
import { FAQ } from '@/lib/faq'

const PASSOS = [
  { n: 1, title: 'Crie o convite', desc: 'Título, data, local e um recado — em menos de um minuto o convite já está pronto.' },
  { n: 2, title: 'Compartilhe o link', desc: 'Manda no grupo do WhatsApp, no story, onde quiser. Não precisa app nem cadastro pra quem recebe.' },
  { n: 3, title: 'Acompanhe quem confirma', desc: 'Cada pessoa que clica no BORA aparece pra você na hora, no seu painel.' },
]

const GRATIS = [
  'Criar convites ilimitados',
  'Editar tudo depois de criado — título, data, local, recado, privacidade, link externo',
  'Trocar a foto e o vídeo de cabeçalho quantas vezes quiser',
  'Ver quem confirmou presença',
  'Compartilhar no WhatsApp e incorporar o convite em outros sites',
  'Confirmar presença (pra quem é convidado, sempre grátis)',
]

export default async function ComoFuncionaPage() {
  const session = await getSession()

  return (
    <InfoPageShell
      title="Como funciona?"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
      heroImage="/como-funciona-hero.jpg"
    >
      <div className="max-w-2xl mx-auto space-y-12 pb-6">

        {/* Intro */}
        <div className="text-center space-y-3">
          <p className="text-gray-600 text-sm leading-relaxed">
            vaikeuvou é a forma mais rápida de criar um convite bonito pra qualquer rolê
            e saber, na hora, quem confirmou &ldquo;BORA&rdquo;. <strong className="text-gray-800">Tudo é grátis</strong> —
            sem crédito, sem assinatura, sem mensalidade.
          </p>
        </div>

        {/* 3 passos */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 text-center">Em 3 passos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PASSOS.map(p => (
              <div key={p.n} className="text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-brand text-white font-extrabold text-sm flex items-center justify-center mx-auto">
                  {p.n}
                </div>
                <p className="font-bold text-gray-800 text-sm">{p.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Grátis */}
        <section className="bg-brand/5 border border-brand/20 rounded-2xl p-5">
          <h2 className="text-xs font-bold text-brand uppercase tracking-wide mb-3">Sempre grátis</h2>
          <ul className="space-y-2">
            {GRATIS.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-brand font-bold flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Imagem por IA */}
        <section>
          <div className="flex items-start gap-3 border border-gray-100 bg-gray-50 rounded-xl p-4">
            <span className="text-2xl flex-shrink-0">✨</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">Imagem de cabeçalho gerada por IA</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Cada convite tem direito a 1 geração grátis por IA — depois disso, continua podendo
                usar os temas prontos ou enviar sua própria foto, sem limite.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 text-center">Dúvidas frequentes</h2>
          <div className="divide-y divide-gray-100">
            {FAQ.map(item => (
              <details key={item.q} className="group py-4">
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-semibold text-gray-800 text-sm [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronIcon className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            Não achou sua dúvida? <a href="/fale" className="text-brand font-semibold hover:underline">Fale conosco</a>
          </p>
        </section>

      </div>
    </InfoPageShell>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
