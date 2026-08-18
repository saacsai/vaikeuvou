import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'

export default async function HistoriaPage() {
  const session = await getSession()
  return (
    <InfoPageShell
      title="18 anos depois"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
      userCredits={session?.users.credits}
      heroImage="/historia-hero.jpg"
    >
      <div className="max-w-2xl mx-auto space-y-6 text-sm text-gray-600 leading-relaxed pb-6">

        <p className="italic text-gray-500">
          Ideias passam. O tempo matura. A essência permanece.
        </p>

        <p>
          Em 2008, o mundo da tecnologia parecia pisar no acelerador como
          nunca. O primeiro iPhone tinha acabado de ser lançado. O Facebook
          engatinhava no Brasil. WhatsApp e Instagram nem existiam no radar.
          Éramos residentes da Incubadora de Santos com um projeto na cabeça
          e muita sede de fazer acontecer. Foi ali que nasceu o
          vaiqueuvou.com.
        </p>

        <p>
          A ideia central já era forte, autêntica e atemporal. Mas, como todo
          jovem empreendedor empolgado pelo brilho das novidades, nos
          deixamos seduzir pelo &ldquo;buzz&rdquo; da época. Em vez de focar
          na verdadeira alma do projeto — aquela que o próprio nome sugere —,
          tentamos transformar o VaiQueUVou em uma rede social no estilo
          MySpace. Fomos arrogantes ao achar que tínhamos a fórmula certa
          para bater de frente com os gigantes.
        </p>

        <p>
          O resultado? O tempo e o mercado nos deram a resposta rápida. O
          projeto não vingou, perdeu tração e acabou engavetado.
        </p>

        <p>
          Hoje, olhemos para trás: as tecnologias mudam com uma velocidade
          brutal, mas as ideias que se conectam com a natureza humana são
          atemporais.
        </p>

        <h2 className="text-lg font-bold text-gray-900 pt-2">Do destilado jovem ao Single Malt 18 Anos</h2>

        <p>
          No universo dos whiskies, existe uma grande diferença entre um
          destilado recém-saído do alambique e um genuíno Single Malt 18
          Anos.
        </p>

        <p>
          O whisky jovem até tem energia e álcool, mas é impulsivo, queima a
          garganta e carece de profundidade. É preciso tempo. São
          necessárias quase duas décadas em um barril de carvalho —
          trocando ar com o ambiente, absorvendo as propriedades da madeira,
          suportando o calor, o frio e a evaporação da &ldquo;Parte dos
          Anjos&rdquo; — para que ele perca a agressividade e ganhe corpo,
          maciez, complexidade e identidade única.
        </p>

        <p>
          Durante esses 18 anos (de 2008 a 2026), o projeto do VaiQueUVou não
          esteve morto. Ele esteve no barril.
        </p>

        <p>
          Nesse período, acumulei quase 30 anos de estrada empreendedora.
          Errei, acertei, criei métricas, aprendi sobre código limpo,
          disciplina, constância e o valor inestimável do propósito. Aos 52
          anos, entendi que tecnologia sem clareza é apenas ruído, mas
          tecnologia com estratégia e propósito transforma vidas.
        </p>

        <h2 className="text-lg font-bold text-gray-900 pt-2">2026: A evolução que fala por si</h2>

        <p>
          Chegamos a 2026. O ecossistema de comunicação mudou radicalmente,
          o WhatsApp se tornou o tecido invisível das conexões humanas e a
          tecnologia finalmente alcançou o que a ideia original precisava.
        </p>

        <p>É por isso que hoje lançamos o vaikeuvou.app.</p>

        <p>
          Não é mais uma tentativa afobada de seguir a modinha do momento. É
          um produto refinado pela experiência, sem ruídos, sem a vaidade de
          tentar ser o que não é. Um legítimo Single Malt com 18 anos de
          maturação no barril da vida real.
        </p>

        <p>
          A nova marca de 2026 traduz exatamente essa evolução: mais direta,
          sólida e pronta para fazer o que sempre deveria ter feito.
        </p>

        <p>
          Seja bem-vindo ao vaikeuvou.app. A ideia sempre foi boa — nós é
          que precisávamos de 18 anos para estar prontos para ela.
        </p>

        <p className="text-gray-900 font-semibold text-[23px] pt-2">Vamo aí?</p>

        <div className="pt-6 border-t border-gray-100">
          <p className="text-sm font-bold text-gray-900">Luciano Maeda</p>
          <p className="text-xs text-gray-400">
            Cofundador vaikeuvou | São Paulino | Curtidor de praia, cerveja, churrasco e pizza com a família e amigos | Corredor pra compensar.
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <a
              href="https://instagram.com/maedaluciano"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-400 hover:text-brand transition-colors"
            >
              <InstagramIcon className="w-3.5 h-3.5" />
              <span className="text-xs">@maedaluciano</span>
            </a>
            <a
              href="https://www.linkedin.com/in/eailucianomaeda/"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-400 hover:text-brand transition-colors"
            >
              <LinkedinIcon className="w-3.5 h-3.5" />
              <span className="text-xs">LinkedIn</span>
            </a>
          </div>
        </div>

      </div>
    </InfoPageShell>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z"/>
    </svg>
  )
}
