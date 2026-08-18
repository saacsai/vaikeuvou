import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'

export default async function TermosPage() {
  const session = await getSession()
  return (
    <InfoPageShell
      title="Termos de uso"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
      userCredits={session?.users.credits}
      heroImage="/termos-hero.jpg"
    >
      <div className="max-w-2xl mx-auto space-y-8 text-sm text-gray-600 leading-relaxed pb-6">

        <p className="text-xs text-gray-400">Última atualização: 17 de agosto de 2026</p>

        <p>
          Estes Termos de Uso regulam o uso do vaikeuvou.app (&ldquo;vaikeuvou&rdquo;, &ldquo;nós&rdquo;),
          um serviço para criar convites, compartilhar com quem você quiser e acompanhar
          quem confirmou presença. Operado por <strong className="text-gray-800">Luciano Maeda
          Estratégia Empresarial LTDA</strong>, CNPJ 44.636.556/0001-44. Ao usar o vaikeuvou —
          seja criando um convite ou confirmando presença em um — você concorda com este
          documento e com a nossa <a href="/privacidade" className="text-brand font-semibold hover:underline">Política de Privacidade</a>.
        </p>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">1. O que é o vaikeuvou</h2>
          <p>
            Uma ferramenta pra criar convites digitais (o &ldquo;convite&rdquo;) e compartilhar
            por link — em geral, pelo WhatsApp. Quem recebe pode confirmar presença com um
            clique no BORA, sem precisar instalar nada nem criar conta. Veja o passo a passo
            completo em <a href="/como-funciona" className="text-brand font-semibold hover:underline">Como funciona?</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">2. Cadastro e conta</h2>
          <p>
            Pra criar convites, você entra com seu número de WhatsApp e um código de
            verificação (OTP) enviado por lá — não usamos senha. Você é responsável por
            manter o acesso ao seu WhatsApp seguro, já que é por ele que entramos em contato
            e confirmamos sua identidade. As informações que você adiciona no perfil (nome,
            foto, bio, Instagram) aparecem publicamente na assinatura dos seus convites.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">3. Confirmar presença (convidado)</h2>
          <p>
            Pra confirmar presença em um convite, pedimos nome e WhatsApp — isso não cria
            uma conta, serve só pra identificar sua confirmação pro anfitrião e evitar
            confirmações duplicadas ou falsas. Dependendo da configuração de privacidade
            escolhida pelo anfitrião, você também pode convidar outras pessoas a partir do
            seu convite confirmado.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">4. Créditos e pagamentos</h2>
          <p>
            Criar e editar convite é sempre gratuito. Alguns recursos (vídeo, foto própria
            de cabeçalho, ver a lista completa de confirmados) usam créditos pré-pagos,
            comprados em pacotes, sem mensalidade e sem validade. Pagamentos são processados
            pelo Stripe — não temos acesso aos dados do seu cartão. Créditos já debitados
            não são reembolsados automaticamente; casos excepcionais podem ser resolvidos
            pelo <a href="/fale" className="text-brand font-semibold hover:underline">Fale conosco</a>. Detalhes de cada recurso pago estão em <a href="/como-funciona" className="text-brand font-semibold hover:underline">Como funciona?</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">5. Uso responsável</h2>
          <p>Ao usar o vaikeuvou, você concorda em não:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Criar convites com conteúdo ilegal, discriminatório, violento ou que assedie terceiros;</li>
            <li>Usar o serviço pra enviar spam ou mensagens não solicitadas via WhatsApp;</li>
            <li>Tentar burlar os limites de crédito, o sistema de convites em árvore ou a segurança da plataforma;</li>
            <li>Se passar por outra pessoa ao confirmar presença ou criar um convite.</li>
          </ul>
          <p>
            Podemos remover convites que violem estas regras e, em casos graves, suspender
            o acesso à conta.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">6. Conteúdo que você envia</h2>
          <p>
            Título, recado, fotos, vídeos e links que você coloca no seu convite são de sua
            responsabilidade. Você garante ter o direito de usar esse conteúdo (por exemplo,
            direitos sobre uma foto própria) e mantém a titularidade sobre ele — só damos a
            ele licença de exibição dentro do vaikeuvou, pra fazer o convite funcionar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">7. Cancelamento e exclusão de conta</h2>
          <p>
            Você pode parar de usar o vaikeuvou quando quiser. Pra excluir sua conta e seus
            dados, ou apagar um convite específico, entre em contato pelo <a href="/fale" className="text-brand font-semibold hover:underline">Fale conosco</a>.
            Créditos não usados não são convertidos em reembolso automático no cancelamento.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">8. Responsabilidade</h2>
          <p>
            O vaikeuvou é uma ferramenta de organização — não organizamos, promovemos nem
            somos responsáveis pelos eventos criados por usuários, nem pela presença efetiva
            de convidados. Fazemos o possível pra manter o serviço no ar e funcionando, mas
            não garantimos disponibilidade ininterrupta.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">9. Alterações destes termos</h2>
          <p>
            Podemos atualizar este documento conforme o serviço evolui. Mudanças relevantes
            serão sinalizadas na própria plataforma. O uso continuado do vaikeuvou depois de
            uma atualização representa concordância com o novo texto.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">10. Contato e legislação aplicável</h2>
          <p>
            Dúvidas sobre estes termos podem ser enviadas pelo <a href="/fale" className="text-brand font-semibold hover:underline">Fale conosco</a>.
            Este documento é regido pelas leis da República Federativa do Brasil, com foro
            eleito na comarca de Santo André/SP.
          </p>
        </section>

      </div>
    </InfoPageShell>
  )
}
