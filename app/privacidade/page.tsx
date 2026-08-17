import { getSession } from '@/lib/auth'
import InfoPageShell from '@/components/InfoPageShell'

export default async function PrivacidadePage() {
  const session = await getSession()
  return (
    <InfoPageShell
      title="Política de Privacidade"
      userName={session?.users.name ?? null}
      userAvatar={session?.users.avatar_url ?? null}
      userCredits={session?.users.credits}
    >
      <div className="max-w-2xl mx-auto space-y-8 text-sm text-gray-600 leading-relaxed pb-6">

        <p className="text-xs text-gray-400">Última atualização: 17 de agosto de 2026</p>

        <p>
          Esta Política de Privacidade explica quais dados o vaikeuvou.app coleta, pra que
          usamos cada um, com quem compartilhamos e quais direitos você tem sobre eles, em
          conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
        </p>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">1. Quem é o responsável pelo tratamento</h2>
          <p>
            <strong className="text-gray-800">Luciano Maeda Estratégia Empresarial LTDA</strong>,
            CNPJ 44.636.556/0001-44, com sede na Av. Industrial, 1680, Jardim, Santo André/SP,
            CEP 09.080-500 — operadora do vaikeuvou.app. Contato: <a href="mailto:fale@vaikeuvou.app" className="text-brand font-semibold hover:underline">fale@vaikeuvou.app</a> ou <a href="/fale" className="text-brand font-semibold hover:underline">Fale conosco</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">2. Quais dados coletamos</h2>
          <p><strong className="text-gray-800">De quem cria um convite (anfitrião):</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Número de WhatsApp — pra login via código de verificação, sem senha;</li>
            <li>Nome, foto de perfil, bio e Instagram, se você preencher — aparecem na assinatura dos seus convites;</li>
            <li>Dados dos convites que você cria (título, data, local, recado, imagens, vídeo);</li>
            <li>Histórico de créditos comprados e usados.</li>
          </ul>
          <p><strong className="text-gray-800">De quem confirma presença (convidado):</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Nome e número de WhatsApp informados na hora de confirmar — não cria uma conta;</li>
            <li>Quem convidou quem, quando a estrutura de convite em árvore permite reconvidar.</li>
          </ul>
          <p><strong className="text-gray-800">Coletados automaticamente:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Um cookie de sessão (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">vkv_session</code>), pra manter você conectado depois do login — não usamos cookies de rastreamento ou publicidade.</li>
          </ul>
          <p>
            Não pedimos nem armazenamos dados de cartão de crédito — o pagamento de créditos
            é feito direto na Stripe.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">3. Para que usamos esses dados</h2>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Autenticar você via WhatsApp e manter sua sessão ativa;</li>
            <li>Exibir a assinatura do anfitrião e a lista de confirmados nos convites;</li>
            <li>Evitar confirmações falsas ou duplicadas (mesmo telefone só confirma uma vez por convite);</li>
            <li>Processar a compra e o débito de créditos;</li>
            <li>Enviar o código de verificação por WhatsApp — e, se você ativar no futuro, notificações de novas confirmações;</li>
            <li>Responder dúvidas enviadas pelo Fale conosco.</li>
          </ul>
          <p>
            Não vendemos seus dados, nem usamos seu telefone pra enviar publicidade de
            terceiros.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">4. Com quem compartilhamos</h2>
          <p>Usamos alguns prestadores de serviço pra operar o vaikeuvou, que têm acesso limitado aos dados necessários pra função deles:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li><strong className="text-gray-800">Stripe</strong> — processamento de pagamento dos pacotes de crédito;</li>
            <li><strong className="text-gray-800">Evolution API / WhatsApp</strong> — envio do código de login e de notificações;</li>
            <li><strong className="text-gray-800">Supabase e Vercel</strong> — hospedagem do banco de dados, arquivos (fotos) e da aplicação.</li>
          </ul>
          <p>
            Esses serviços podem processar dados em servidores fora do Brasil. Não
            compartilhamos seus dados com terceiros pra fins de marketing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">5. Por quanto tempo guardamos</h2>
          <p>
            Enquanto sua conta ou seus convites existirem. Se você pedir exclusão pelo Fale
            conosco, apagamos os dados pessoais associados, exceto o que formos legalmente
            obrigados a manter (por exemplo, registros fiscais de pagamento).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">6. Seus direitos</h2>
          <p>De acordo com a LGPD, você pode a qualquer momento:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Confirmar se tratamos algum dado seu, e acessar esses dados;</li>
            <li>Corrigir dados incompletos, desatualizados ou incorretos;</li>
            <li>Pedir a exclusão dos seus dados ou da sua conta;</li>
            <li>Pedir a portabilidade dos seus dados pra outro serviço;</li>
            <li>Saber com quem compartilhamos seus dados;</li>
            <li>Revogar, a qualquer momento, o consentimento dado.</li>
          </ul>
          <p>
            Pra exercer qualquer um desses direitos, fale com a gente pelo <a href="/fale" className="text-brand font-semibold hover:underline">Fale conosco</a> ou <a href="mailto:fale@vaikeuvou.app" className="text-brand font-semibold hover:underline">fale@vaikeuvou.app</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">7. Segurança</h2>
          <p>
            Login sem senha (só código de verificação), sessão protegida por cookie
            criptografado e acessível somente pelo servidor, e senha de acesso restrita aos
            sistemas internos que guardam seus dados. Nenhum sistema é 100% imune a
            incidentes — se algo acontecer, avisaremos as pessoas afetadas conforme exige a
            LGPD.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">8. Menores de idade</h2>
          <p>
            O vaikeuvou não é direcionado a crianças. Se você tem menos de 18 anos, use o
            serviço com a orientação de um responsável legal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">9. Alterações desta política</h2>
          <p>
            Podemos atualizar este documento conforme o serviço evolui. Mudanças relevantes
            serão sinalizadas na própria plataforma, com a data de atualização revisada no
            topo desta página.
          </p>
        </section>

      </div>
    </InfoPageShell>
  )
}
