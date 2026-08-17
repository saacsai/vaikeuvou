import Link from 'next/link'
import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'
import { CREDIT_PACKAGES } from '@/lib/stripe'

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const PASSOS = [
  { n: 1, title: 'Crie o convite', desc: 'Título, data, local e um recado — em menos de um minuto o convite já está pronto.' },
  { n: 2, title: 'Compartilhe o link', desc: 'Manda no grupo do WhatsApp, no story, onde quiser. Não precisa app nem cadastro pra quem recebe.' },
  { n: 3, title: 'Acompanhe quem confirma', desc: 'Cada pessoa que clica no BORA aparece pra você na hora, no seu painel.' },
]

const GRATIS = [
  'Criar convites ilimitados',
  'Editar tudo depois de criado — título, data, local, recado, privacidade, link externo',
  'Escolher entre os temas de capa prontos',
  'Ver o total de confirmados',
  'Compartilhar no WhatsApp',
  'Confirmar presença (pra quem é convidado, sempre grátis)',
]

const PAGO = [
  {
    emoji: '📹',
    title: 'Vídeo do convite',
    custo: '1 crédito',
    desc: 'Cola o link do YouTube ou Vimeo e ele aparece embaixo do botão BORA. Cobra 1 crédito toda vez que você adiciona ou troca o vídeo — inclusive a primeira vez, já na criação.',
  },
  {
    emoji: '🖼️',
    title: 'Foto própria de cabeçalho',
    custo: '1 crédito',
    desc: 'Quer usar uma foto sua no lugar dos temas prontos? 1 crédito toda vez que você envia ou troca a foto — os temas prontos continuam grátis sempre.',
  },
  {
    emoji: '👀',
    title: 'Ver quem confirmou',
    custo: '3 créditos',
    desc: 'A lista completa de quem confirmou presença (nome, quando confirmou, quem convidou quem) custa 3 créditos — pago uma vez, fica desbloqueada pra sempre naquele convite.',
  },
  {
    emoji: '✨',
    title: 'Imagem gerada por IA',
    custo: '3 créditos',
    desc: 'Em breve: gere uma imagem de cabeçalho única pro seu convite com IA. 3 créditos a cada geração.',
  },
]

const FAQ = [
  {
    q: 'Os créditos expiram?',
    a: 'Não. Uma vez comprado, o crédito fica no seu saldo até você usar — sem prazo de validade.',
  },
  {
    q: 'Editar o convite depois de criado custa alguma coisa?',
    a: 'Não. Editar título, data, local, recado, privacidade e link externo é sempre grátis, quantas vezes você quiser. Só vídeo e foto própria usam crédito — inclusive a primeira vez.',
  },
  {
    q: 'Se eu ficar sem crédito no meio da criação do convite, o que acontece?',
    a: 'O convite é criado normalmente, só sem o vídeo e/ou a foto que dependiam de crédito. Dá pra completar depois, quando comprar mais.',
  },
  {
    q: '"Ver quem vai" cobra toda vez que eu abro a lista?',
    a: 'Não. É um desbloqueio único por convite — paga uma vez e a lista de confirmados fica liberada pra sempre naquele convite específico.',
  },
  {
    q: 'Quem é convidado precisa pagar alguma coisa?',
    a: 'Não. Confirmar presença (clicar no BORA) é sempre grátis pra quem recebe o convite. Só quem cria usa créditos, e só nas ações listadas acima.',
  },
  {
    q: 'O pagamento é seguro?',
    a: 'Sim — processado pelo Stripe, uma das maiores plataformas de pagamento do mundo. O vaikeuvou não guarda dado de cartão.',
  },
  {
    q: 'Posso pedir reembolso?',
    a: 'Fala com a gente pelo Fale conosco que a gente resolve.',
  },
]

export default async function ComoFuncionaPage() {
  const session = await getSession()

  return (
    <InfoPageShell
      title="Como funciona?"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
      userCredits={session?.users.credits}
    >
      <div className="max-w-2xl mx-auto space-y-12 pb-6">

        {/* Intro */}
        <div className="text-center space-y-3">
          <p className="text-gray-600 text-sm leading-relaxed">
            vaikeuvou é a forma mais rápida de criar um convite bonito pra qualquer rolê
            e saber, na hora, quem confirmou &ldquo;BORA&rdquo;. Criar e editar convite é
            sempre grátis — só um punhado de recursos extras usa <strong className="text-gray-800">créditos pré-pagos</strong>,
            sem assinatura, sem mensalidade.
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
        <section className="bg-green-50 border border-green-100 rounded-2xl p-5">
          <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">Sempre grátis</h2>
          <ul className="space-y-2">
            {GRATIS.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Pago */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">O que usa crédito</h2>
          <p className="text-xs text-gray-400 mb-4">
            Cobra sempre que você usa — sem &ldquo;primeira vez grátis&rdquo;, inclusive já na criação do convite.
          </p>
          <div className="space-y-3">
            {PAGO.map(item => (
              <div key={item.title} className="flex items-start gap-3 border border-amber-100 bg-amber-50 rounded-xl p-4">
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                      {item.custo}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/creditos"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-base uppercase tracking-wide transition-colors shadow-lg shadow-brand/20"
          >
            Comprar créditos
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Pacotes */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 text-center">Pacotes de créditos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CREDIT_PACKAGES.map(pkg => (
              <div key={pkg.credits} className="border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-lg font-extrabold text-gray-900">{pkg.credits}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">créditos</p>
                <p className="text-sm font-semibold text-gray-700">{fmtBRL(pkg.price_cents)}</p>
                <p className="text-[10px] text-gray-400">{fmtBRL(pkg.price_cents / pkg.credits)}/crédito</p>
              </div>
            ))}
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

        {/* CTA final */}
        <div className="text-center pt-2">
          <Link
            href="/creditos"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-base uppercase tracking-wide transition-colors shadow-lg shadow-brand/20"
          >
            Comprar créditos
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </InfoPageShell>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
