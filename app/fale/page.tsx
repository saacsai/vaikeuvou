import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'
import FaleClient from './FaleClient'
import { FAQ } from '@/lib/faq'

export default async function FalePage() {
  const session = await getSession()
  return (
    <InfoPageShell
      title="Fale conosco"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
      userCredits={session?.users.credits}
      heroImage="/fale-hero.jpg"
    >
      <div className="max-w-2xl mx-auto space-y-10 pb-6">

        <p className="text-sm text-gray-600 leading-relaxed text-center">
          Dúvida, sugestão, reclamação ou proposta — manda pra gente que a
          gente responde. Também dá pra escrever direto pra{' '}
          <a href="mailto:fale@vaikeuvou.app" className="text-brand font-semibold hover:underline">fale@vaikeuvou.app</a>.
        </p>

        <FaleClient userName={session?.users.name ?? null} userEmail={session?.users.email ?? null} />

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
            Mais detalhes em <a href="/como-funciona" className="text-brand font-semibold hover:underline">Como funciona?</a>
          </p>
        </section>

        <section className="text-center space-y-1 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <p className="font-semibold text-gray-500">Luciano Maeda Estratégia Empresarial LTDA</p>
          <p>CNPJ 44.636.556/0001-44 — Santo André/SP</p>
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
