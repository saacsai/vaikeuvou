# vaikeuvou.app — Status

Última atualização: 2026-10-04

## Sessão 2026-10-04 (2ª parte) — monitor WhatsApp por email + calendário (.ics/Google) + fix RSVP grátis sem confirmação

**Monitor de desconexão WhatsApp** (`app/api/cron/monitor-evolution/route.ts`): o Luciano reportou
"erro no envio de WhatsApp de novo" — instância `vaikeuvou` tinha caído (`state: close`).
Investigando o porquê do alerta automático (roda a cada ~30min via GH Actions) não ter avisado:
o alerta usava uma instância de OUTRO produto (`Bia fazdireito.ai`) pra mandar o aviso — e ela
TAMBÉM estava desconectada, então o envio falhava em silêncio (rota não checava o resultado).
**Fix**: alerta trocado pra email (`lib/email.ts`, novo, via SMTP Hostinger — mesma caixa
`fale@vaikeuvou.app` já usada no WordPress, ver memória `feedback_evolution_api_webhook` e sessão
2026-09-28 parte 4), não depende mais de nenhuma instância Evolution. Rota também loga se o
próprio envio do alerta falhar. Testado com envio real, confirmado recebido. Env vars novas
(`SMTP_HOST/PORT/USER/PASS`, `ADMIN_EMAIL`) em `.env.local` e Vercel produção.

**Links de calendário** (`.ics` + Google Calendar) — pedido do Luciano depois de perguntar como
adicionar confirmação de evento na agenda:
- `lib/calendar.ts` (novo): `gerarIcsContent()` gera RFC 5545 em UTC puro (sufixo `Z`, sem precisar
  declarar `VTIMEZONE`); `googleCalendarUrl()` monta a URL de template do Google
  (`calendar.google.com/calendar/render`); `fmtDataConfirmacao()` migrado de dentro do webhook MP
  pra cá (reaproveitado também no RSVP grátis agora).
- `GET /api/eventos/[slug]/ics` (novo) — endpoint público, mesmo padrão de leitura anônima por
  slug de `app/e/[slug]/page.tsx`. `DTEND` usa `event_date_fim` se existir, senão
  `duration_minutes`, senão default de 3h.
- `components/CalendarLinks.tsx` (novo) — os 2 botões, reaproveitados na tela de sucesso inline
  do RSVP (`EventoClient.tsx`) e no `SucessoConviteModal`.
- `lib/miniMarkup.ts` ganhou `stripMiniMarkup()` — descrição do evento em contexto de texto puro
  (`.ics`, WhatsApp) não pode mostrar os marcadores `**`/`_`/`++` crus, só no HTML renderizado.

**Bug real encontrado nessa investigação**: o Luciano reportou que confirmou presença no próprio
evento e não recebeu nada por WhatsApp. Causa: `app/api/rsvp/route.ts` (RSVP **gratuito**) NUNCA
mandou confirmação por WhatsApp — só `app/api/webhooks/mercadopago/route.ts` (fluxo **pago**)
mandava. Não era específico de ele ser o criador, acontecia pra qualquer RSVP grátis. **Fix**:
RSVP grátis agora manda a mesma confirmação (texto + os 2 links de calendário); webhook MP também
ganhou os links na mensagem que já mandava.

Tudo testado (`tsc --noEmit` + `npm run build` limpos, endpoint `.ics` testado local e em produção
com o evento real "Show do Deep Purple", email de teste confirmado recebido) e já em produção
(`ef1025c`, `3f8ff85`).


## Sessão 2026-10-03 (16ª parte) — conteúdo: fix rodapé + #SouFã São Paulo

**Fix**: rodapé da LP do evento (`app/e/[slug]/EventoClient.tsx`) tinha texto "vaikeuvou.app" mas
o link ia pra `live.vaikeuvou.app` (resolvido em runtime via `window.location.origin`) — trocado
pra `href="https://vaikeuvou.app"` fixo, já commitado (`9296e9c`).

**#SouFã São Paulo** (post 298, WordPress, `draft`): gerado a partir do `blog_brief`
`d56d8933-1f6b-409a-b4bf-512ed07f6b21` (status → `gerado`), que o Luciano subiu inspirado em ter
acabado de editar o #VamoAí? do Deep Purple. Categoria "São Paulo" (id 40, reaproveitada do post
do Deep Purple — regra de 1 post por destino) + tag `#SouFã` (id 36). Imagem destacada importada
da URL que ele já tinha subido no brief (attachment 299), não gerada por IA.

Conteúdo: abertura pessoal (paulistano, São Paulo Futebol Clube, prós>>contras), ideia central do
Luciano foi deixar 2 músicas "falarem" pela cidade em vez de resenha exaustiva (dentro da regra do
pilar — "não tenta ser exaustivo, é o mapa geral") — `[embed]` do vídeo oficial de cada uma:
"São Paulo, São Paulo" (Premeditando o Breque, 1983) e "São Paulo" (365, 1987, clipe oficial
remasterizado) — links achados por busca real, não inventados. Fecho seguiu as 2 partes
obrigatórias do pilar: CTA explícito pro botão "Sou Fã" + trocadilho de assinatura inédito
("Vaikeuvou São Paulo, a gente se cruza no meio do trânsito mesmo").

**Pendente**: Luciano revisar o draft antes de publicar (mesmo padrão de todo #VamoAí?/#SouFã
anterior — ele edita, eu leio e adoto como correção de template se for o caso).


## Sessão 2026-10-03 (14ª parte) — Cancelar evento / Adiar evento

Dois botões novos no painel, ao lado de "Editar evento" (`app/dashboard/[edit_token]/
DashboardClient.tsx`), fechando o fio da conversa de hoje sobre quórum/reembolso. Perguntei
direto ao Luciano as duas decisões de risco antes de construir:

- **Reembolso em cancelamento com vendas pagas: fica MANUAL** (confirmado) — sistema cancela,
  avisa todo mundo por WhatsApp (`lib/evolution.ts`), sinaliza quantas pessoas pagaram, mas o
  estorno em si o organizador processa direto no Mercado Pago. Dois cliques pra confirmar quando
  há venda envolvida (`confirmarCancelar`).
- **Adiar sem nova data: permitido** (confirmado) — campo de nova data é opcional, sem ela marca
  `data_a_definir=true` (bloqueia nova confirmação na página pública até alguém editar a data de
  verdade — resolvido automaticamente em `/api/eventos/editar` quando `event_date` muda de novo).

`cancelado_em` reaproveitado do fluxo de quórum (já existia) como flag geral de cancelamento.
Página pública (`EventoClient.tsx`) ganhou overlay de cancelado/adiado, mesmo padrão visual do
"evento já aconteceu" que já existia, bloqueando confirmação nos dois casos.

**Migration pendente**: `supabase_migration_cancelar_adiar_evento.sql` revelada no Finder.


## Sessão 2026-10-03 (13ª parte) — edição do evento vira seções recolhíveis

Mesmo motivo de poluição visual do `/criar`, mas solução diferente: edição não vira wizard forçado
(quem já conhece o evento quer mexer numa coisa específica, não navegar passo a passo). `app/
dashboard/[edit_token]/DashboardClient.tsx`: mesmos 4 agrupamentos do wizard (Básico/Preço/Vagas/
Capa) como `AccordionSection` (novo componente local, reaproveitável só aqui por ora) — abre só a
seção que quer, "Básico" vem aberta por padrão. Preview ao vivo mantido do lado (diferente do
/criar) — decisão deliberada, faz mais sentido ajustando algo que já existe. Zero campo/regra
removido, só reorganização visual, mesmo princípio do wizard.


## Sessão 2026-10-03 (12ª parte) — /criar virou wizard de 5 etapas

Formulário cresceu muito (quórum, organizador, editor mínimo — tudo das partes anteriores desta
mesma sessão) e virou scroll longo e poluído, com preview ao vivo competindo atenção. Reescrito
`app/criar/CriarClient.tsx` como wizard: (1) Básico, (2) Preço e pacote, (3) Vagas e divulgação,
(4) Capa e assinatura, (5) Revisão (preview só aparece aqui agora, não mais ao vivo lateral).
Validação por etapa (`validarEtapa(n)`) + revalidação completa no submit final (cobre navegação
pelo histórico do browser). Evento continua nascendo num único POST no final — etapas são só
organização de UI, sem criação parcial no banco. Mesma regra de negócio de antes, zero campo
removido, só reorganizado.

**Não testado visualmente** (página exige login, não dá pra simular sessão real pra testar) —
Luciano precisa clicar nas 5 etapas e confirmar que o fluxo ficou do jeito esperado.


## Sessão 2026-10-03 (11ª parte) — LP do evento mais larga no desktop

`max-w-lg` (512px fixo) → `max-w-lg md:max-w-xl lg:max-w-2xl` (512→576→672px) no card principal
de `app/e/[slug]/EventoClient.tsx`. Mobile intocado. Largura moderada de propósito (coluna única,
não reestruturada pra 2 colunas) — teto pra não deixar a linha de texto larga demais de escanear.
Alternativa de layout 2 colunas (banner + info lado a lado) registrada como opção futura, não feita.


## Sessão 2026-10-03 (10ª parte) — editor mínimo estendido

`MiniEditor` ganhou prop `maxLength` e foi aplicado em mais 2 lugares: mensagem de quem convida
(`SucessoConviteModal`, 200 caracteres) e "Comentários"/description nos dois formulários de
evento. `EventoClient.tsx` e `EventPreviewCard.tsx` (preview ao vivo em `/criar`) atualizados pra
renderizar a marcação — `description` é fallback visual de `heroMensagem` no mesmo bloco, tinham
que ficar consistentes (senão um mostra formatação, o outro mostra `**asteriscos**` cru). De
carona, `EventPreviewCard` ganhou o mesmo laranja `#ff6600` nos links Local/externo que a LP já
tinha (tinha ficado pra trás no ajuste da 9ª parte).


## Sessão 2026-10-03 (9ª parte) — ajustes visuais na LP + editor mínimo

LP do evento (`app/e/[slug]/EventoClient.tsx`): link "Local" e link externo/personalizado
`text-brand` (preto, pós-rebrand) → `#ff6600` (mesmo laranja do corpo dos posts do blog); preço
com mais destaque (`font-bold text-gray-900 text-lg`); títulos "O que está incluso"/"Programação"
que se perdiam junto do texto abaixo (quase mesmo peso visual) → `text-sm font-extrabold
text-gray-900`, separação clara agora.

**Editor mínimo** (negrito/itálico/sublinhado) em "O que está incluso" e "Programação" —
`lib/miniMarkup.ts` (marcação leve `**negrito**`/`_itálico_`/`++sublinhado++`, escapa tudo antes
de renderizar, só depois troca os 3 padrões conhecidos por tag — sem aceitar HTML cru do usuário,
zero risco de XSS) + `components/MiniEditor.tsx` (textarea com 3 botões que envolvem a seleção
atual). Sem biblioteca nova. Aplicado nos dois formulários (criar + editar) e na renderização
pública. Escopo deliberadamente restrito a esses 2 campos — não estendido a `description`/
`organizador_descricao` ainda, avisar se quiser.


## Sessão 2026-10-03 (8ª parte) — botão do embed corrigido + campos de organizador no evento

**Bug corrigido**: `/embed/[slug]` (botão CTA publicado dentro de cada post #VamoAí?, iframe fixo
320x70 no HTML do post) estava sendo cortado — padding/fonte do botão passavam de 70px de altura.
Reduzido padding (`p-1.5`/`py-2.5`), fonte (`text-sm`) e ícone (`h-4`) pra caber com folga. Texto
do CTA trocado de "Confirme presença. Vamo aí?" pra "Bora, quero ir também!".

**Gap real identificado**: o template do #VamoAí? (documentado na 7ª parte) tem seção "Quem está
organizando?" — mas o sistema não tinha like nenhum de onde tirar esse dado automaticamente.
Luciano concluiu corretamente que precisava virar campo capturado, não algo que a IA inventa.
Adicionado `organizador_nome/descricao/endereco/contato/horario/link` (opcionais) em `events` —
aparecem em `/criar` e `/dashboard` só quando "Autorizo divulgar no blog" está marcado, nome do
organizador vira obrigatório nesse caso (client + server). `composeVamoAiBrief` já inclui esses
dados na pauta automática — próximo #VamoAí? real já chega com isso pronto, sem brief manual.

**Migration pendente**: `supabase_migration_organizador_evento.sql` revelada no Finder.


## Sessão 2026-10-03 (7ª parte) — primeiro #VamoAí? publicado, template real documentado

Luciano publicou o post 266 (Cachoeira do Elefante, rascunho de 2026-09-30) — primeiro #VamoAí?
de verdade no ar. Li o resultado final e documentei em `PERFIL_CRIADOR.md` como template oficial
pra próximas gerações automáticas: título "Dia DD/MM/AAAA Cidade-UF: ... #VamoAí?", estrutura
fixa (abertura linkando `#VaikeuFui` relacionado se existir → "O que é o passeio" → H2-pergunta de
pré-requisito → "Quem está organizando?" → "VamoAí?" fechando). **Mudança mais importante**: o CTA
final deixou de ser link de texto simples e virou o **widget embedado** (`/embed/<slug>`, mesmo
iframe do "código de incorporação" do dashboard) — mostra confirmação ao vivo direto no post.


## Sessão 2026-10-03 (6ª parte) — quórum de evento (vagas mín/máx) + contador de clique externo

Longa sessão de brainstorming antes de implementar (necessidade real, veio de apresentação pra
15 pessoas) — decisões fechadas: quórum é obrigatório na criação, exceto checkout externo
(organizador controla por fora); máximo é trava automática real; mínimo NUNCA bloqueia sozinho —
é sempre decisão do organizador, inclusive podendo tocar o evento abaixo do mínimo se achar
viável; retenção do repasse MP até a decisão é tese válida (confirmada via blog oficial MP: split
≠ repasse, existe "evento de liberação", reembolso em split já é rateado entre organizador e
plataforma automaticamente) mas **não implementada ainda** — precisa ler a API real de retenção
antes de integrar dinheiro de verdade.

**Construído**: `events.vagas_minimas/vagas_maximas/data_viabilizacao/viabilizacao_confirmada_em/
cancelado_em`; função `vkv_confirmar_rsvp` no banco (trava a linha do evento, checa
`vagas_maximas` antes de inserir — race-safe de verdade, não só checagem informativa) usada no
RSVP livre e no webhook MP; pré-checagem informativa em `/api/rsvp/checkout` antes de abrir o MP;
campos obrigatórios em `/criar` e `/dashboard` (exceto com link externo preenchido); painel de
quórum no dashboard com barra de progresso + botões Confirmar realização (libera assim que atinge
o mínimo, não precisa esperar a data) / Cancelar evento (sempre disponível enquanto pendente);
página pública mostra "Esgotado" quando lotado e progresso quando tem mínimo definido; tabela
`event_external_clicks` + rota `/api/eventos/clique-externo` registrando clique no link externo.

**Pendente/fora de escopo desta leva, flagueado de propósito**: retenção/liberação de repasse MP
e reembolso automático em cancelamento — os botões Confirmar/Cancelar só gravam a decisão
(timestamp), não mexem em dinheiro ainda.

**Migration pendente**: `supabase_migration_quorum_evento.sql` revelada no Finder, Luciano
precisa rodar antes de testar qualquer coisa desta leva. **Ainda não testado ao vivo** (migration
não rodada) — primeira coisa a validar quando rodar: criar um evento com quórum, confirmar
RSVPs até o máximo e conferir se trava mesmo (inclusive testar 2 abas simultâneas na última
vaga).


## Sessão 2026-10-03 (5ª parte) — logo do WordPress na tela de login (/vaikeuvou_admin)

Tela de login (hook `login_enqueue_scripts` em `functions.php`) trocou o "W" padrão do WordPress
pelo símbolo da mãozinha (mesmo arquivo do preloader, `quarta_hand.png`) — CSS inline
`.login h1 a { background-image: ... }`. Link do logo (`login_headerurl`) agora aponta pro
próprio site em vez de wordpress.org. Texto acessível/alt (`login_headertext`) trocado de
"Powered by WordPress" pra "vaikeuvou.app". **Achado**: `login_h1_title` (filtro que eu tentei
primeiro, por hábito de versões mais novas do WP core) não existe nesta versão instalada — o
filtro certo aqui é `login_headertext`, confirmado lendo `wp-login.php` direto no servidor.


## Sessão 2026-10-03 (4ª parte) — /wp-admin escondido, login custom em /vaikeuvou_admin

Plugin **WPS Hide Login** instalado via WP-CLI (`wp plugin install wps-hide-login --activate`),
slug configurado via `wp option update whl_page vaikeuvou_admin`. `/wp-admin` e `/wp-login.php`
agora redirecionam/404 pra uma página 404 genérica (zero pista pra quem tentar adivinhar); login
de verdade só em `https://vaikeuvou.app/vaikeuvou_admin`. Confirmado via curl (wp-admin → 302 pra
`/404/`, wp-login.php → 404, vaikeuvou_admin → 200 com form de login presente).

**Recuperação se travar algum dia**: desativar o plugin via SSH (renomear a pasta
`wp-content/plugins/wps-hide-login`) volta pro `/wp-admin` padrão na hora, sem mexer no banco.


## Sessão 2026-10-03 (3ª parte) — logo 5px mais alto, nos dois lugares

Ajuste fino pedido por causa da proporção da marca nova (quarta evolução). **App Next.js**:
`-mt-[15px]` → `-mt-[20px]` nos 6 lugares onde o logo fica ao lado do breadcrumb/nav
(`InfoPageShell`, `CriarClient`, `DashboardClient`, `convidados/page`, `meus-convites/page`) —
mesmo valor que já vinha sendo fine-tuned desde o rebrand anterior. **WordPress**: `.custom-logo,
.dark-custom-logo { transform: translateY(-5px); }` novo em `style.css` do tema filho (não
existia ajuste de posição vertical no logo antes). Confirmado ao vivo nos dois.


## Sessão 2026-10-03 (2ª parte) — preloader trocado pra símbolo da mãozinha

Preloader nativo do tema (`#preloader1`, tela branca de carregamento inicial) mostrava bolinha
quicando (`.spnc_bounceball`) + texto em inglês "Loading Now". Pedido: só o símbolo da marca.

**Feito** (tema WordPress via SSH):
- Símbolo extraído do `quarta_evolucao_marca_vaikeuvou.png` (mesmo usado na troca de marca da
  sessão anterior, `/tmp/quarta_hand.png`), subido pra biblioteca de mídia do WP (`wp media
  import`, attachment 276, `wp-content/uploads/2026/10/quarta_hand.png`).
- `newsblogger/functions.php`: override de `newscrunch_preloader_feature` (mesmo padrão
  `function_exists` já usado antes pro rodapé) — markup novo é só `<img class="vkv-preloader-
  icon">`, sem bolinha nem texto.
- `newsblogger/style.css`: animação `vkvPreloaderBounce` (translateY, 700ms alternate infinite)
  no lugar do `spncBounce` original.
- Backup `functions.php.bak-2026-10-03-pre-preloader` no servidor antes de sobrescrever.
- Confirmado ao vivo via curl: markup novo presente, zero "Loading Now"/`spnc_bounceball`
  restante, animação nova no CSS servido.


## Sessão 2026-10-03 — fonte do WordPress trocada pra Arial/Helvetica (igual ao app)

Luciano perguntou qual fonte o app Next.js usa (Arial/Helvetica, hardcoded em
`app/globals.css`) e qual o WordPress usa — achei **Jost** (Google Font do tema NewsBlogger/
NewsCrunch, aplicada quase em tudo: body/botão/input/título de post/breadcrumb) + **Anton+Jost**
e **Poppins** em alguns widgets específicos (incluindo meu próprio `.vkv-fan-btn`/`.vkv-fan-count`
do botão #SouFã) — fontes diferentes entre app e blog. Pediu pra unificar tudo pra Arial/Helvetica.

**Feito** (fora do repo Next.js — arquivos do tema WordPress, Hostinger via SSH):
- `newsblogger/style.css` e `style-rtl.css`: 45 e 43 ocorrências de `font-family: Jost/jost/
  Anton+Jost/Poppins/[stack system-ui]` trocadas por `Arial, Helvetica, sans-serif` — editei em
  local (`/tmp/vkv-theme-fix/`, Python/regex, verificado antes de subir), não no servidor direto.
- `inc/theme-color/custom-color.php` (CSS gerado dinamicamente via PHP, hookado em `wp_footer`,
  sobrescreve `style.css` normal): 1 ocorrência (`.spnc-highlights-1 .spnc-highlights-title h3`)
  também trocada.
- **Preservado de propósito**: `font-family: FontAwesome` (ícones, não é fonte de texto — trocar
  quebraria os glifos) — confirmei que ficou intacto nos 2 arquivos CSS.
- Backups no servidor: `style.css.bak-2026-10-03-pre-arial`, `style-rtl.css.bak-2026-10-03-pre-
  arial`, `custom-color.php.bak-2026-10-03-pre-arial`.
- Como são edições em arquivo de tema, não precisou de `!important` pra vencer especificidade
  (diferente de injetar uma regra nova) — só troquei o valor dentro da regra já existente.
- Confirmado ao vivo: `wp cache flush` + o hook de versionamento por `filemtime()` (já existia de
  sessão anterior) já forçou `style.css?ver=<novo timestamp>` automaticamente — zero Jost/Anton/
  Poppins no CSS servido, FontAwesome intacto.


## Sessão 2026-10-02 (5ª parte) — correção: marca certa era a quarta evolução, não a terceira

Luciano apontou que o arquivo usado na parte anterior (`terceira_marca_original.png`) estava
errado — o correto é `~/Vaikeuvou/logos e botoes/novo/quarta_evolucao_marca_vaikeuvou.png`.
Refeito tudo com o arquivo certo: mesmo processo (trim, recolorido branco, ícones com
círculo+anel redesenhado, logo-vertical reconstruído reaproveitando as faixas de texto), mas
símbolo da mão extraído DIRETO deste arquivo (coluna 1083-1264, bbox 182x233) em vez de reusar
`vaikeuvou_simbolo.png` da leva de 24/set (que era da evolução anterior, não bate mais). Proporção
real mudou de novo: `logo.png` 1457x401 → 1230x315 — `width`/`height` do `next/image` corrigidos
nos mesmos 13 lugares de novo. Commit `bc3d2f5`.


## Sessão 2026-10-02 (4ª parte) — terceira evolução da marca

Marca nova (ref: `~/Vaikeuvou/logos e botoes/novo/terceira_marca_original.png`): mão evoluída de
forma (dedo mais alto/esguio, traços mais limpos), reposicionada pra DEPOIS do texto "vaikeuvou"
(antes vinha antes). Padrão cromático preservado (tinta quase-preta ~#1F1A17). Mesma marca já
estava no header do WordPress — Luciano trocou direto por lá antes de pedir aqui (attachment 271,
`cropped-terceira_evolucao_vaikeuvou_site.png`).

Atualizado no app: `public/logo.png` (proporção mudou de 1557x354 pra 1457x401 — `width`/`height`
do `next/image` corrigidos nos 13 lugares que usam o arquivo), `public/logo-white.png`
(recolorido), `public/logo-vertical.png` (reconstruído reaproveitando as faixas de texto
originais "vaikeuvou"/"vamo aí?", só trocando o ícone), `app/icon.png`/`apple-icon.png`/
`favicon.ico` (círculo+anel redesenhado do zero — tentar só apagar a mão antiga por cima do
arquivo existente quebrava o anel, porque a área de apagar cruzava o traço fino do círculo).

**Pendente, não mexido ainda**: o favicon do PRÓPRIO WordPress (`site_icon`, attachment 204,
`2026/09/cropped-favicon.png`) continua com a mão antiga — só o logo do header foi trocado por
Luciano. Avisar/perguntar antes de trocar.

**Nota**: um arquivo solto `public/logo-white - cópia.png` (duplicata órfã, não referenciada em
código nenhum) acabou entrando no commit junto por estar na mesma pasta — inofensivo, mas vale
limpar numa próxima faxina.


## Sessão 2026-10-02 (3ª parte) — toggle de acesso a "Criar post" + widget /embed/destinos refinado

- **`/admin/usuarios`**: nova coluna "Criar post" com toggle — habilita `pode_criar_post` (coluna
  nova em `users`) por usuário, sem precisar mexer em env var. `canAccessPautas` mudou de
  assinatura (recebe o usuário inteiro, não só o telefone) — `EDITOR_PHONES` continua valendo como
  fallback.
- **`/embed/destinos`**: várias rodadas de ajuste visual pra bater com ref13/ref14/ref15 — card
  branco com sombra (não borda), `rounded-md` (6px, padrão do tema, não o rounded-xl do
  Tailwind), imagem com metade da altura (`aspect-[2/1]`), título saiu de dentro do iframe (fica
  a cargo de um widget nativo de Heading do WordPress acima dele). Ganhou altura dinâmica via
  `postMessage` (`window.load` + `ResizeObserver`) — sem isso o iframe ficava com altura fixa
  chutada, sobrando espaço em branco quando tinha menos destinos que o previsto.
- **Bug real encontrado**: o widget WordPress não atualizava porque (1) cache de objeto do
  WordPress servia versão antiga mesmo depois de editar, e (2) o editor de blocos (Gutenberg)
  cortava a tag `<script>` quando colada pelo painel admin. Resolvido via SSH/WP-CLI: `wp cache
  flush` + reescrita direta do `widget_block` no banco (bypassa o sanitizador da UI).


## Sessão 2026-10-02 (2ª parte) — redirect da raiz + link de login no iframe

- `next.config.ts`: raiz de `live.vaikeuvou.app` (`/`) mandava pro blog (`vaikeuvou.app`) — agora
  redireciona pra `/criar`, dentro do próprio app.
- `app/embed/perfil/page.tsx` (widget que roda em `<iframe>` na sidebar do WordPress): estado
  deslogado ganhou link "Já tem conta? Efetuar login" (`/login?next=/meus-convites`) abaixo do
  botão "Criar evento" — texto discreto, não botão, pra não competir visualmente (mesmo princípio
  "uma ação clara" do benchmark Google Busca já fixado nesta sessão de identidade visual).

## Sessão 2026-10-02 — upload opcional de imagem destacada na pauta

Problema: imagem destacada do post hoje vem de IA (ou falta) — quando é o Luciano criando,
tanto faz, mas quando é outra pessoa publicando, falta correr atrás da foto depois. Fix:
`PautaForm` ganhou campo de upload opcional (`imagem_destacada_url` em `blog_briefs`), com
validação client-side de dimensão mínima 1280x768 antes de aceitar o arquivo. Reaproveita o
bucket `event-headers` (pasta `blog-briefs/`) em vez de criar bucket novo. Tabela de pautas
(`/admin/pautas`) mostra um badge "📷 imagem" quando a pauta já tem foto anexada, pra quem for
processar saber que não precisa gerar/buscar uma.

**Pendente**: migration `supabase_migration_add_imagem_blog_briefs.sql` revelada no Finder,
Luciano precisa rodar no Supabase antes do upload funcionar de verdade.

**Importante pro processamento da fila (não é automático ainda)**: não existe pipeline que
converte `blog_briefs` pendente em rascunho WordPress sozinho — isso continua manual, feito por
mim numa sessão quando pedido pra "processar a fila". A partir de agora, ao processar uma pauta
que já tenha `imagem_destacada_url` preenchida, usar essa foto como imagem destacada do post em
vez de gerar uma por IA — checar esse campo sempre antes de gerar imagem nova.


## Sessão 2026-09-30 — primeiro `#VamoAí?` real de verdade + 2 bugs corrigidos no FAQPage

Primeira pauta `#VamoAí?` automática gerada por um evento real (opt-in de divulgação ativado):
"Cachoeira do Elefante — Trilha Mirante/Mirante", evento pago (R$128, 10/10), linkado com o post
`#VaikeuFui` já existente sobre a mesma cachoeira (deixando claro que é rota/operador diferente —
guiado, pago, via Vale Verde — da caminhada pessoal do Luciano). Postmeta `vkv_event_*` setados,
Event + FAQPage confirmados no schema. Rascunho no WordPress (post 266), aguardando revisão.

**2 bugs reais achados e corrigidos no extrator de FAQPage** (`vkv_extrair_faq`,
`newsblogger/functions.php`), ambos existentes desde a implementação original (2026-09-26),
nunca detectados porque nenhum post anterior expôs os dois casos ao mesmo tempo:
1. Regex `(.*?\?)` pro texto da pergunta cruzava a tag `</h2>` quando um H2 ANTERIOR não
   terminava em "?" — grudava duas perguntas num texto só. Fix: `([^<]*?\?)`, impede cruzar
   fronteira de tag.
2. Posts criados sem `<p>` explícito no `post_content` (parágrafo confiado no `wpautop` do
   WordPress, que só roda na exibição) nunca batiam com o regex — **o post "Como funciona?"
   (218) nunca teve FAQPage nenhum desde que foi publicado**, apesar de ter 6 perguntas em H2.
   Fix: `wpautop($post->post_content)` antes de extrair, normaliza os dois estilos de conteúdo.

Confirmado ao vivo em 3 posts (Cachoeira, Como Funciona, O que é vaikeuvou) depois do fix — todas
as perguntas esperadas aparecem corretas.

## Sessão 2026-09-29 — bug real: crons do GitHub Actions parados desde 23/09

Luciano reportou vários e-mails de falha ("Run failed: Lembrete de check-in"). Não era da
Vercel (achou que sim pelo formato do e-mail) — é GitHub Actions (`.github/workflows/`).

**Causa raiz**: os 2 workflows (`checkin-lembrete.yml`, `monitor-evolution.yml`) chamavam
`https://vaikeuvou.app/api/cron/...` — domínio que virou o blog WordPress em 23/09. Antes disso a
URL "errada" funcionava por coincidência (apontava pro próprio app). Depois da migração do
domínio pro blog, toda chamada dava 404, e os dois crons ficaram **silenciosamente parados desde
23/09 16:38 UTC** — ou seja, lembretes de check-in via WhatsApp e o monitor da instância WhatsApp
não rodaram por 6 dias sem ninguém perceber (só apareceu porque o e-mail de falha do GitHub
chamou atenção).

**Fix**: trocado pra `https://live.vaikeuvou.app/api/cron/...` (domínio correto do app Next.js)
nos dois arquivos. Disparo manual dos 2 workflows confirmou `success` depois do fix. Commit
`c7e348d`.

## Sessão 2026-09-28 (4ª parte) — slug /contact/ → /fale-conosco/

Slug trocado pra bater com o nome real da página. WordPress só redireciona slug antigo sozinho
pra `post`, não pra `page` — sem isso a URL antiga viraria 404. Adicionado redirect manual (301,
hook `template_redirect` no tema filho) pra não quebrar link externo/salvo. Também corrigidos os
4 posts que linkavam pra `/contact/` (247, 218, 137, 138 — Tendeu "Gratuito x pago", Tendeu "Como
funciona", Termos de Uso, Política de Privacidade), agora apontando direto pra `/fale-conosco/`
sem passar pelo redirect.

## Sessão 2026-09-28 (3ª parte) — SMTP autenticado pro e-mail transacional do WordPress

Continuação da parte 2: o formulário de `/contact/` reportava `status: mail_sent`, mas o Luciano
não recebeu o e-mail de teste. Causa: `wp_mail()` usava `mail()` cru do PHP (via wrapper
`hsendmail` da Hostinger), sem DKIM configurado — Gmail provavelmente descartava/marcava como
spam silenciosamente, mesmo com SPF presente.

**Fix**: SMTP autenticado via `phpmailer_init` (tema filho) apontando pra `smtp.hostinger.com:465`
(SSL), autenticando com a caixa real `fale@vaikeuvou.app`. Credenciais em constantes no
`wp-config.php` (`VKV_SMTP_*`, fora do tema — nunca versionado, arquivo só existe no servidor).
Testado com `wp_mail()` direto via wp-cli + captura de `wp_mail_failed` — sem erro, PHPMailer
confirmou envio aceito pelo servidor SMTP (não é mais só o "sucesso genérico" do CF7).
**Confirmado pelo Luciano: e-mail chegou de verdade na caixa principal.** `/contact/` está
funcional de ponta a ponta.

## Sessão 2026-09-28 (2ª parte) — corrige /contact/ (lixo de demo do tema) + regra de fecho #SouFã

**Bug real corrigido**: `https://vaikeuvou.app/contact/` era conteúdo de demonstração do tema,
nunca customizado — um shortcode de formulário apontando pra um form inexistente ("Formulário de
contato não encontrado") e um mapa do Google embutido mostrando **Londres**. Substituído por
conteúdo real, no espírito de `/fale` do app: intro + `fale@vaikeuvou.app`, formulário de contato
funcional de verdade (form CF7 119, que já existia mas não estava em uso — testado com um envio
real, `status: mail_sent`, chega em `luciano.maeda@gmail.com`), FAQ (mesmas perguntas do
`/como-funciona`), rodapé com razão social/CNPJ. Título da página também tinha erro de digitação
("Fale consco") — corrigido pra "Fale conosco".

Também formalizada regra de fecho do `#SouFã` (CTA explícito + trocadilho marca+destino),
calibrada comparando o rascunho de Ubatuba com a edição real do Luciano — ver `PERFIL_CRIADOR.md`.

## Sessão 2026-09-28 — 2ª leva de posts + confirmação do botão #SouFã em produção

Confirmado: o botão "Tbm sou fã" foi usado de verdade (1 registro real em `city_fans`, post da
Bertioga, feito pelo Luciano na noite de 27/09) — ciclo completo (clique → login → volta marcado)
validado em produção.

Processadas as 2 pautas que estavam pendentes:
- **Post 247** — "Eventos gratuitos x Eventos pagos qual a diferença no vaikeuvou? #Tendeu" —
  explica o modelo de negócio (campo de valor em branco = grátis, ingresso/rateio = pago,
  Mercado Pago, comissão padrão 15%, por que cobrança adiantada aumenta comparecimento real).
  Fecha o loop de uma promessa deixada no post "Como funciona?" (post 218, que ganhou o link real
  no lugar do texto solto "vou contar com calma num post separado").
- **Post 245** — "#SouFã Ubatuba" — 2º post-âncora de destino (depois de Bertioga). Categoria
  `Ubatuba` criada do zero (não existia). Menciona 4 praias específicas (Enseada, Domingas Dias,
  Itamambuca, Praia da Fazenda) como gancho pra futuros `#VaikeuFui`.

Ambos rascunho, aguardando revisão/capa/publicação do Luciano.

## Sessão 2026-09-27 (4ª parte) — #SouFã na fila de pautas

`/admin/pautas` ganhou `#SouFã` como 5º tipo de pauta manual (post-âncora de destino), com copy
própria no formulário (título = nome do destino, "ideias centrais" = visão geral da cidade, não
experiência pontual). Migration `supabase_blog_briefs_soufa.sql` rodada e confirmada (insert de
teste aceito e removido). Commit `2dc952f`.

Com isso, os 5 pilares editoriais (#VaikeuFui, #Tendeu, #ProntoFalei, #VamoAí?, #SouFã) estão
todos disponíveis na fila — 4 manuais direto no formulário, `#VamoAí?` automático via opt-in de
evento.

## Sessão 2026-09-27 (3ª parte) — botão #SouFã corrigido + regra fixa de título por pilar

Luciano publicou os 2 rascunhos da parte 1 (216, 218) ele mesmo, trocando slugs/títulos —
confirmei que o WordPress redirecionou (301) as URLs antigas sozinho, nada quebrou. Post 180
(o "Como funciona?" original) foi pra lixeira, substituído pelo 218.

**Fix**: botão "Tbm sou fã" tava com texto branco em fundo branco por padrão — de novo o
`body.newsblogger button {color:#fff}` do `custom-color.php` sobrescrevendo sem `!important`
(mesmo bug do `.vkv-pill`/`.vkv-clear`, dessa vez em cima de um elemento novo). Corrigido e
redesenhado: botão sempre branco preenchido (nunca "invisível" contra a faixa preta), fica
laranja (`#ff6600`) quando a pessoa já é fã — usa a cor de link inline como acento de estado.

**Regra fixa de título, sem exceção (formalizada em `PERFIL_CRIADOR.md`)**: nunca usa `:` no
título. `#SouFã`/`#VaikeuFui` prefixam ("#VaikeuFui Praia da Boracéia"); `#VamoAí?`/
`#ProntoFalei`/`#Tendeu` assinam o final ("Título #Tendeu"). Aplicada retroativamente em todos os
9 posts publicados — títulos e links internos entre eles corrigidos pra apontar direto nas URLs
canônicas atuais (evita saltos de redirect desnecessários).

Commit `087e583`.

## Sessão 2026-09-27 (2ª parte) — 5º pilar #SouFã: post-âncora de destino + botão de fã

Novo pilar editorial: 1 post por destino (categoria), visão geral da cidade — não resenha de um
lugar específico (isso continua sendo `#VaikeuFui`). Post 86 (antes "#VaikeuFui: Bertioga")
virou o primeiro caso real: "#SouFã: Bertioga", mantendo as tags de tema (Praias/Passeios/etc).

**Botão "Tbm sou fã" + contador**, ativa sozinho em qualquer post com a tag `#SouFã` — mesmo
padrão de gatilho automático do FAQPage/Event (nenhuma configuração manual por post):
- Tabela `city_fans` (Supabase, migration `supabase_city_fans.sql`, **revelada no Finder, ainda
  não rodada**) — toggle por `user_id`+`wp_post_id`.
- `GET/POST live.vaikeuvou.app/api/city-fans` — mesma ponte cross-domain (`credentials:
  'include'`) já usada pros comentários.
- `newsblogger/assets/js/fan-button.js` + hooks em `functions.php` — renderiza o botão, consulta
  contador, alterna estado.
- **Login/verificar agora aceita `next` externo** (só pro domínio `vaikeuvou.app`, com whitelist
  contra open redirect) — necessário pra devolver a pessoa pro mesmo post do blog depois de logar,
  já marcando como fã automaticamente (sem precisar clicar de novo).

Commits `db51a05`, `0aca72d`. Migration rodada e API testada de ponta a ponta com conta
descartável (criada e apagada na hora): GET → POST marca fã (count 0→1) → GET confirma → POST
desmarca (count 1→0) → GET confirma. **Só falta testar o clique de verdade no navegador** (sem
login → botão → tela de login → volta logado → marca sozinho) — isso depende do WhatsApp real do
Luciano pro OTP, não dá pra simular.

## Sessão 2026-09-27 — primeiro teste real da fila editorial + regra de cor de link

Primeira vez processando `blog_briefs` de ponta a ponta. Duas pautas pendentes (uma `Revisar`,
uma `Tendeu` manual, ambas sobre `#Tendeu: Como funciona?`/`#Tendeu: O que é vaikeuvou?`),
escritas seguindo `PERFIL_CRIADOR.md`, criadas como rascunho no WordPress e marcadas `gerado`.
**Aprovado pelo Luciano** ("Sensacional! Do jeito que eu queria, aprovadíssimo") — primeira
validação real da voz + pipeline funcionando.

- Post 216 — `#Tendeu: O que é vaikeuvou?` (novo, rascunho).
- Post 218 — `#Tendeu: Como funciona? (revisão)` (rascunho SEPARADO do post 180 ao vivo, conforme
  regra de `Revisar` — Luciano vai aplicar manualmente ao publicar, já escolhendo a imagem de
  capa).
- FAQ antigo (`<details>`) do "Como funciona?" convertido pra H2-pergunta — ativa o FAQPage
  automático implementado na parte 10.

**Ajuste de regra, direto do feedback**: link dentro do corpo do post tem que ser laranja
(`#ff6600`, padrão antigo do vaikeuvou) sem sublinhado parado, sublinha só no `:hover` — a nota
anterior em `PERFIL_CRIADOR.md` dizia preto (pós-rebrand), estava errada pra esse caso específico.
Corrigido com uma regra CSS global no tema filho (`newsblogger/style.css`), cobre todo post
automaticamente — passado e futuro — sem precisar editar HTML de post nenhum. Confirmado ao vivo.

## Sessão 2026-09-26 (parte 11) — acabamentos finais: link no iframe, header do admin, regra de CTA

Três ajustes pequenos fechando a sessão:

- **"Criar post" faltava no `/embed/perfil`** (painel de conta dentro do iframe da sidebar do
  WordPress) — só tinha sido adicionado no menu de bolinhas do app principal. Adicionado, mesmo
  gate (`canAccessPautas`).
- **`/admin` (inclusive `/admin/pautas`)** trocou o link de texto "← live.vaikeuvou.app" pelo
  mesmo `ProfilePopover` (menu de bolinhas) usado em toda tela logada do app — padroniza o
  header.
- **Regra fixa de encerramento pro `#VamoAí?`**, formalizada em `PERFIL_CRIADOR.md`: todo post
  termina com CTA linkado direto pra página DAQUELE evento específico
  (`https://live.vaikeuvou.app/e/<slug>`, já vem no brief), nunca um link genérico pro app.

Commits `573f0fb`, `506204f`.

## Sessão 2026-09-26 (parte 10) — Schema.org (GEO/AEO) + llms.txt no blog WordPress

Resolvida a "parte 2" pendente do Manual de GEO e AEO (a parte 1 foi a fila `blog_briefs`).

**Descoberta no meio do caminho**: o Yoast (`wordpress-seo` v28.5) já emitia `Article`/`WebPage`/
`ImageObject`/`Person` (autor) por post — a suspeita inicial de "schema inexistente" era falsa,
vinha de eu ter testado a URL errada sem o prefixo de categoria (permalink é
`/%category%/%postname%/`). Só faltava: `sameAs` real do autor (resolvido setando os campos
nativos `instagram`/`linkedin` no perfil do usuário — o próprio Yoast já lê esses campos, zero
código) e o nível de categoria no `BreadcrumbList` (o do Yoast pula direto pra o post, mesmo com
`_yoast_wpseo_primary_category` setado — não resolvido do lado do Yoast, contornado com bloco
próprio).

**Construído** (tema filho `newsblogger/functions.php`, função `vkv_schema_post`, hookada em
`wp_head` — testado e confirmado ao vivo com posts reais e um rascunho de teste):
- `BreadcrumbList` completo (Início > Categoria/destino > Post).
- `FAQPage` automático — extrai qualquer `<h2>` terminando em "?" seguido de `<p>`. Regra prática
  documentada em `PERFIL_CRIADOR.md`: `#Tendeu` precisa escrever a pergunta literalmente nesse
  formato pra ganhar o FAQPage de graça.
- Base do `Event` (só ativa com postmeta `vkv_event_date` etc.) — pronta pra quando a automação
  do `#VamoAí?` passar a setar esses campos ao criar o post.
- `llms.txt` publicado em `https://vaikeuvou.app/llms.txt` — descreve o site, os 4 pilares
  editoriais e os links principais, em formato simples pra agente de IA.

**Pendências que ficam de fora** (são conteúdo, não técnico): `Review`/`LocalBusiness` pra
`#VaikeuFui` sobre local específico; resumo/descrição escrita nas páginas de categoria (destino).

Detalhe técnico completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`.

## Sessão 2026-09-26 (parte 9) — link "Criar post", tipo "Revisar" e editores na fila

Três pedidos encadeados sobre a fila `blog_briefs` (parte 8):

1. **Link "Criar post"** no menu de perfil (ícone de bolinhas), ao lado de "Criar evento", pra
   quem tem acesso à fila (`canAccessPautas`) — abre `/admin/pautas` direto.
2. **Tipo "Revisar"**: 4ª opção no formulário, pra revisar um post JÁ publicado — título vira
   "título exato do post no WordPress" (é assim que ele é localizado), ideias centrais vira "o
   que revisar". `PERFIL_CRIADOR.md` documenta que o processamento tem que ler o post original
   antes de reformular. Migration `supabase_blog_briefs_revisar.sql` amplia o check constraint.
3. **Multiusuário**: decisão de que outras pessoas (ex: Sandro) podem alimentar a fila, mas com
   a MESMA voz do blog (não uma voz por pessoa — simplifica e evita o problema de não ter
   histórico de edição pra calibrar voz de gente nova). `lib/auth.ts` ganhou `canAccessPautas()`
   — admin sempre pode, mais uma lista fixa em `EDITOR_PHONES` (env, ainda vazia — adicionar o
   telefone do Sandro lá quando for a hora). Nova coluna `blog_briefs.criado_por` (migration
   `supabase_blog_briefs_criado_por.sql`) grava quem mandou cada pauta manual: **admin vê a fila
   inteira** (com coluna "Criado por"), **editor só vê as próprias**. Entradas automáticas do
   #VamoAí? (`criado_por` nulo, vêm de evento de qualquer usuário do app) só aparecem pro admin.
   `/admin/usuarios` e `/admin/eventos` ganharam gate próprio (antes só dependiam da navegação do
   layout) pra um editor não conseguir ver essas telas digitando a URL direto.

Commits `75af595`, `087413a`. Falta rodar as duas migrations novas no Supabase (reveladas no
Finder) e, quando o Sandro (ou outra pessoa) for começar a usar, adicionar o telefone dele em
`EDITOR_PHONES` no Vercel.

Detalhe técnico completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`.

## Sessão 2026-09-26 (parte 8) — fila editorial `blog_briefs`

Continuação da parte 5: em vez de um pipeline automático com IA/pesquisa web, decisão do Luciano
foi por uma fila simples de captura — sem Gemini/web-search envolvido no app por enquanto.

**Feito**:
- Tabela `blog_briefs` (`tipo`, `titulo`, `ideias_centrais`, `status` pendente/gerado, `event_id`
  opcional) — migration `supabase_blog_briefs.sql` revelada no Finder, **ainda não rodada** no
  Supabase.
- `/admin/pautas` (`app/admin/pautas/`) — tela admin-only com formulário de captura rápida
  (tipo/título/ideias centrais) pros 3 pilares manuais (#VaikeuFui/#Tendeu/#ProntoFalei) + tabelas
  de pendentes/já geradas.
- Entrada automática do `#VamoAí?`: quando `divulgar_blog` vira `true` (na criação em
  `app/api/eventos/route.ts` ou na edição em `app/api/eventos/editar/route.ts`), insere sozinho
  uma pauta com brief composto a partir dos dados do evento (`lib/blogBrief.ts`,
  `composeVamoAiBrief`) — sem IA, só texto. Na edição só insere na transição false→true, pra não
  duplicar a cada salvamento do form.
- Coluna `divulgar_blog` (pendência da parte 5) confirmada rodada em produção.

**Processamento** (não é código, é workflow): quando o Luciano abrir o Claude Code e pedir, a IA
lê `blog_briefs` com `status=pendente`, usa `PERFIL_CRIADOR.md` como referência de voz, escreve
cada post e cria como RASCUNHO no WordPress (nunca publica sozinha), marcando `status=gerado`.
Frequência esperada: a cada ~2 dias.

Commit `977b883`, build/deploy verificados.

Detalhe técnico completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`.

## Sessão 2026-09-26 (parte 7) — fix: imagem por IA "grudava" em eventos novos

Bug real: gerar imagem por IA em `/criar` nunca marcava a geração como resolvida no banco (só
acontecia no painel, que já tem `edit_token`) — a linha ficava `pending`/`event_id null` pra
sempre e reaparecia como "recuperável" em todo evento novo, mesmo já usada antes. Corrigido em
`app/api/eventos/route.ts`: ao criar o evento, resolve qualquer geração pendente órfã do usuário
(aprova a que bate com a capa usada, rejeita as outras). 1 registro órfão real em produção
(evento "Caça ao Tesouro Bertioga") corrigido manualmente via REST API. Commit `5772ab3`.

Detalhe técnico completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`.

## Sessão 2026-09-26 (parte 6) — 10 imagens de cabeçalho do evento sem filtro laranja

As fotos-preset de `lib/headers.ts` (Show/Futebol/Aventura/Reunião/Amigos/Confraternização/
Bem-estar/Praia/Surf/Corrida) tinham duotone laranja da entrega antiga do Sandro. Trocadas por
fotos limpas, mapeadas por conteúdo real de cada uma (não por ordem numérica), com cor pastel de
fundo recalculada a partir da própria foto nova. Exceção: **"Corrida" continua com o filtro
laranja** — não havia original limpo disponível, pendência conhecida pra trocar quando tiver a
foto certa. Commit `07aab04`, confirmado no ar.

Detalhe técnico completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`.

## Sessão 2026-09-26 (parte 5) — início da automação editorial do blog

Comentei o `Manual de GEO e AEO — vaikeuvou.app.md` do Luciano (achados: tag `#VamoAí?` sem
nenhum post, Schema.org estruturado inexistente, `llms.txt` inexistente) e isso virou o início de
uma frente de automação de geração de posts nos 4 pilares editoriais.

**Feito**:
- `PERFIL_CRIADOR.md` (raiz do repo) — as 18 regras de voz do Luciano + os 4 pilares editoriais,
  formalizados num arquivo versionado (antes só em memória). É o insumo central de qualquer
  geração futura.
- `events.divulgar_blog` — opt-in "Autorizo divulgar esse evento no blog vaikeuvou", visível em
  `/criar` e no painel só quando o evento é "Aberto" (`max_depth = 999`, a definição de evento
  público do vaikeuvou). Migration `supabase_divulgar_blog.sql` rodada (coluna confirmada em
  produção na parte 8).

**Ainda não construído**: o pipeline de geração de verdade (pesquisa na web + IA usando
`PERFIL_CRIADOR.md` + rascunho automático no WordPress via REST API) pro `#VamoAí?`; o mecanismo
de brief manual (título + descritivo) pros outros 3 pilares; Schema.org estruturado por tipo de
post.

Detalhe técnico completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`.

## Sessão 2026-09-26 (parte 4) — ponte de identidade nos comentários do blog

Quem está logado no `live.vaikeuvou.app` agora comenta reconhecido no blog WordPress — sem
preencher nome/e-mail, com a foto real na lista de comentários. Quem não tem conta comenta como
sempre (nome + e-mail avulso, sem exigir nada).

**Como**: novo endpoint `GET live.vaikeuvou.app/api/comment-identity` (CORS só pra
`vaikeuvou.app`) devolve identidade de quem está logado; script no blog
(`newsblogger/assets/js/comment-identity.js`) chama isso e pré-preenche/esconde os campos do
formulário nativo do WP; foto vai num campo oculto, salva como `comment_meta` no envio, e um
filtro `get_avatar_url` troca o Gravatar padrão pela foto real. Comentário continua sendo salvo
inteiramente no WordPress — sem migração de banco, sem perder moderação/spam nativos.

**Pendente de teste real**: não dá pra simular sessão de navegador via SSH/curl — falta o Luciano
confirmar ao vivo (logar, abrir um post, ver se reconhece automaticamente).

Detalhe técnico completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`.

## Sessão 2026-09-26 (parte 3) — página "Buscar Eventos" no blog WordPress

No ar: `https://vaikeuvou.app/buscar/`. Busca por palavra-chave + filtro por Cidade (categoria) e
Tema (tag), 100% funcional, filtrando no cliente contra os posts reais carregados via `WP_Query`
no template `newsblogger/page-templates/buscar.php`.

**Preparação (mesma sessão)**: migração de taxonomia — "Trilhas" era subcategoria de "Bertioga"
(não escala pra 80 cidades, duplicaria por cidade); virou tag compartilhada, junto com Passeios/
Praias/Restaurantes. Os 8 posts existentes foram revisados e marcados com essas tags novas.
Categorias hoje são só "Bertioga" e "Troca de ideias", ambas raiz — cidade nova = categoria nova
sem hierarquia, decisão deliberada de não antecipar a estrutura Estado→Cidade até ter uma segunda
cidade fora de SP.

**Fluxo de design**: protótipo interativo publicado como Artifact antes de codar (dados mockados,
filtro já funcionando em JS) — aprovado antes de portar pra PHP real.

**Cidade/Tema dinâmicos**: nada hardcoded — puxa direto de `get_categories()`/`get_tags()`, então
cidade nova aparece no filtro sem tocar em código. Corpus pequeno hoje, filtro 100% client-side
(sem AJAX) — revisar se o volume de posts crescer bastante.

Removido o widget de busca por palavra-chave da sidebar (substituído por link pra `/buscar/`).

Detalhe técnico completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`.

## Sessão 2026-09-26 (parte 2) — coerência WordPress↔Next.js: rodapé, páginas legais, ícone, nomenclatura

4 ajustes pontuais pedidos pelo Luciano, commit `275fa13` no `vaikeuvou` (Next.js) + edições no
tema WordPress via SSH:

1. **Rodapé do `live.vaikeuvou.app`**: removido o link "18 anos depois" (conteúdo já vive no
   blog WordPress); mantém só Termos de uso / Política de Privacidade.
2. **Páginas legais duplicadas removidas**: `/termos` e `/privacidade` do Next.js deletados
   (confirmado 404 em produção). Todos os links (rodapé, `/criar`, `/login`,
   `ConfirmarPresencaModal`) agora apontam pra `vaikeuvou.app/termos-de-uso/` e
   `/politica-de-privacidade/` no WordPress.
3. **Ícone do painel de conta**: trocado no WordPress de `fa-circle-user` pro mesmo SVG de 9
   pontinhos (`GridIcon`) já usado no header do Next.js — pixel-idêntico, não só parecido.
   Editado em `main-header.php` (override de tema filho).
4. **Convite(s) → Evento(s)** em toda a UI visível do Next.js (títulos, breadcrumbs, botões,
   placeholders, mensagens de erro de API) — ~14 arquivos, pra bater com a CTA "Criar Evento" já
   usada no WordPress. Mantido "convite" só no sentido de convidar alguém (verbo) — rotas internas
   (`/meus-convites`) não mudaram, só o texto visível.

**Ajustes finos, mesma sessão**: (a) ícone dos pontinhos no desktop alinhado verticalmente com o
texto do menu (`transform: translateY(7px)` — micro-ajustado de 10px pra 7px depois de conferência
visual, só `@media (min-width: 1101px)`); (b) achado importante — o ícone separado
(`.spnc-widget-toggle`) nunca renderizou de forma confiável no mobile/tablet (mesmo mistério nunca
resolvido da sessão anterior). Em vez de insistir nele, o ícone do PRÓPRIO botão hambúrguer
(`.spnc-menu-open`, comprovadamente mobile-only) foi trocado pros mesmos pontinhos —
mobile/tablet passa a abrir o painel de conta (já embutido no drawer principal) por um botão com
ícone de pontinhos (`translateY(3px)` de micro-ajuste), sem depender do elemento que nunca
funcionou direito em tela estreita.

**Painel de conta deslogado (mesma sessão)**: logo trocado de `/logo-vertical.png` (com a tagline
"vamo aí?" embutida na imagem) pro `/logo.png` padrão (mãozinha + wordmark horizontal, o mesmo do
resto do app); texto de venda reescrito por pedido do Luciano. Duplicação de logo no mobile
(sidebar do WP já mostra o próprio logo acima do drawer) resolvida com `?nologo=1` — só o iframe
mobile usa esse parâmetro, o widget desktop separado continua mostrando o logo normalmente.

Detalhe técnico completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`.

## Sessão 2026-09-26 — regressão no desktop após fix de mobile (WordPress)

A correção de 2026-09-25 (ver seção abaixo) embutiu o iframe do painel de conta dentro do
`.spnc-collapse#spnc-menu-open` — só que esse container não é exclusivo de mobile: em telas
largas ele vira o próprio menu horizontal do desktop (sempre visível, sem off-canvas). Resultado:
o painel (com CTA "Criar evento" e tagline no estado deslogado) passou a aparecer como um bloco
grande no meio do header do desktop, quebrando o layout (ver `ref11.png`). Corrigido com CSS:
`.vkv-embed-perfil-wrap { display: none; }` como regra base + `display: block` só dentro de
`@media (max-width: 1100px)` (mesmo breakpoint que o tema já usa pra alternar desktop/mobile).
Confirmado ao vivo que o CSS novo está no ar — pendente de confirmação visual do Luciano.

## Sessão 2026-09-25 — painel de conta sumia no tablet/mobile (WordPress)

Achado pelo Luciano: no menu mobile/tablet do blog WordPress (tema NewsBlogger/NewsCrunch), só
apareciam "Home / Como funciona? / Criar evento" — sem nenhum caminho pra ver avatar, "Meus
convites", "Editar perfil" ou "Sair" quando logado. No desktop existia um segundo ícone (separado
do hambúrguer) que abria uma sidebar com o painel de conta completo (via
`<iframe src="https://live.vaikeuvou.app/embed/perfil">`, página que já existia desde antes,
feita sem header/rodapé de propósito pra rodar em iframe) — esse ícone/painel secundário some em
algum breakpoint responsivo que não foi possível localizar apesar de busca exaustiva em todo
CSS/JS do tema (pai e filho).

**Registrado nesta sessão**: acesso SSH da Hostinger que hospeda o WordPress (perdido entre
sessões por nunca ter sido salvo) — ver
`~/.claude/projects/-Users-lucianomaeda/memory/vaikeuvou_hostinger_ssh.md`.

**Resolvido definitivamente**: em vez de seguir caçando a causa do sumiço, o iframe do painel de
conta foi embutido direto dentro do drawer do **menu principal** (o que sempre abre pelo
hambúrguer comum, confirmado como robusto em qualquer largura desde o início) — logo no topo,
antes de "Home". Editado em `wp-content/themes/newsblogger/partials/header/main-header.php`
(override de tema filho — não mexe no tema pai `newscrunch`, sobrevive a atualização). Testado e
confirmado funcionando pelo Luciano.

**Achados técnicos ao longo da correção** (detalhe completo em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`):
- O tema tem vários templates de header alternativos escolhidos pelo theme mod `header_layout`
  (`'9'` → `header-nav.php`, `'2'` → `default-header.php`, `'10'` → `woo-header.php`, qualquer
  outro valor, incluindo o valor real deste site `'full'` → `main-header.php`) — sempre conferir
  `wp theme mod get header_layout` antes de editar "o" header de um tema assim.
- O CSS do tema filho (`style.css`) é enfileirado pelo tema pai sem versão explícita
  (`get_stylesheet_uri()` sem `$ver`), então o WP usa a versão do core como query string —
  igual pra todo asset do site, não muda quando só o CSS muda. Resultado: a Cloudflare (que fica
  na frente do site, cache de 7 dias pra estáticos) servia a cópia antiga indefinidamente mesmo
  com o arquivo já corrigido na origem. Corrigido de vez com um hook em `wp_enqueue_scripts`
  (prioridade 20, depois do tema pai) que reenfileira `newscrunch-style` com versão =
  `filemtime()` do `style.css` — toda edição futura já sai com URL nova automaticamente.

## Sessão 2026-09-19 — PIVÔ TravelTech (QG receptivo Bertioga + turismo gamificado)

⭐ Mudança de direção mais importante do produto até aqui. Detalhe completo do racional
estratégico e pessoal em
`~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md` — ler antes de mexer em
monetização, blog ou eventos-experiência. Fonte original: `Vaikeuvou/pivotamento/
VAIKEUVOU_2027.pdf` (fora do repo).

Resumo do que foi decidido e implementado nesta sessão:
- Software atual vira motor logístico de um novo braço de turismo receptivo/gamificado em
  Bertioga (sócio Sandro), não mais o produto final sozinho.
- Camada de curto prazo (QG = ponto de informação turística grátis + comissão de parceiros
  locais) não precisa de nada novo no app — é operação humana. Camada gamificada (pacotes
  pagos, Stripe Connect) fica pra depois, não implementada ainda.
- `blog.vaikeuvou.app` (WordPress, mesmo padrão de subdomínio do `app.cooperliga.com.br`)
  planejado pra posts em 1ª pessoa terminando no botão embedável (`/embed/[slug]`, já existia).
- Campo `cidade` adicionado em `events` (estruturado, não inferido de `location`).
- Botão de copiar código de incorporação no dashboard do evento.
- **Sistema de créditos eliminado por completo**: troca de foto/vídeo livre; imagem por IA
  virou 1 grátis por evento (sem cobrança, trava por contagem); `/creditos` e checkout Stripe de
  crédito removidos.

**Tudo commitado e deployado** — commit `17c89a0`, confirmado em produção (`npm run build`
limpo, `/creditos` → 404, `/criar` e `/embed/[slug]` respondendo). **Pendente**: rodar
`supabase_cidade.sql` no SQL Editor do Supabase (não consigo rodar migration sozinho, só tenho
chaves REST) — sem isso o campo `cidade` não persiste de verdade. Nada disso foi testado ao vivo
por Luciano ainda.

> Este arquivo ficou parado entre 2026-08-19 e 2026-08-26, e de novo
> entre 2026-08-26 e 2026-09-16 — as sessões desses períodos (logo
> final do Sandro, check-in "Eu fui", painel `/admin`, campo de
> duração de evento, monitor de saúde do WhatsApp, destaque do
> check-in, fixes de upload de foto) estão documentadas em
> `~/.claude/projects/-Users-lucianomaeda/memory/project_vaikeuvou.md`,
> não aqui. Ver aquele arquivo pra esses intervalos.

## Sessão 2026-09-16 — botão embedável (`/embed/[slug]`), 1ª peça de 2 features em debate

Duas features novas trazidas pelo Luciano, discutidas em profundidade
antes de codar (pedido explícito dele: "antes de programar vamos
ajustar o princípio e funcionalidade antes"). Resumo completo do
debate em `project_vaikeuvou.md` — aqui só o que foi de fato
construído.

**Princípio fechado**: as duas features (widget embedável em
sites/blogs + reconvite personalizado em cascata na árvore de
convidados) são a mesma peça de dados — um "convite personalizado"
(foto + mensagem) ancorado a um nó real da árvore (criador = raiz,
cada RSVP = um nó) — só que com duas saídas diferentes: link
compartilhável ou iframe embedável. Ainda não implementado; só o
botão-base do embed foi construído como teste (peça isolada, sem a
personalização em cascata ainda).

**Construído**: `app/embed/[slug]/page.tsx` — página isolada (sem
header/footer do site, pensada pra rodar dentro de `<iframe>`),
renderiza só um botão no estilo BORA ("Confirme presença. Vamo aí?"),
sem repetir título/data/local do evento (ficaria redundante com o
texto do post onde for colado). Clique sempre abre `/e/[slug]` **em
nova aba** — decisão deliberada de não tentar RSVP dentro do próprio
iframe (cookie de terceiro quebra em Safari/Chrome hoje em dia). Já
propaga `?ref=` (mesmo parâmetro que `/e/[slug]` já usa pra
`parentRsvpId`), preparando terreno pra quando a personalização em
cascata existir. Testado local com evento real (`show-do-deep-purple-
C-Dmi`): build limpo, 404 correto pra slug inexistente, `ref`
propagando certo. Commit `328a404`, push feito, deploy automático.

**Pendências explícitas (não implementadas ainda, próxima sessão)**:
- Personalização (foto + mensagem) por nó da árvore, oferecida
  opcionalmente após confirmar presença ("Pular" sempre visível).
- Cascata: cada nível da árvore mostra quem especificamente convidou
  aquela pessoa (não a raiz/criador do evento).
- Gerador de código de embed na UI (dashboard do criador e no link de
  reconvite do convidado) — hoje o iframe precisa ser montado à mão.
- Abrir "quem vai" de graça (tirar o paywall de 3 créditos) — decisão
  de negócio pendente de validação com tração real antes de reverter.

**Nota solta**: `vkv-prompt-test-grupo.jpg` continua sem uso/sem
rastreamento no repo (resíduo de teste antigo de imagem por IA) —
perguntar ao Luciano se apaga ou versiona.

## Sessão 2026-08-26 — imagens definitivas de cabeçalho (10 presets)

Sandro entregou as 10 fotos definitivas (duotone laranja da marca),
substituindo os placeholders do Picsum que estavam no ar desde
2026-08-15. As fotos não bateram 1:1 com as categorias antigas
(`balada, show, praia, corrida, futebol, viagem, pizza, cinema,
churrasco, bike`) — vieram temas novos (reunião corporativa,
yoga/bem-estar, confraternização) e faltaram outros (pizza, cinema,
churrasco, bike, viagem). Categorias novas, mapeadas pelo conteúdo
real e aprovadas pelo Luciano: **Show, Futebol, Aventura, Reunião,
Amigos, Confraternização, Bem-estar, Praia, Surf, Corrida**.

Antes de apagar qualquer arquivo, consultei a tabela `events` de
produção: 4 convites reais ainda tinham `bg_image_url` apontando pra
`pizza.jpg`/`cinema.jpg`/`churrasco.jpg` — esses **ficaram no disco**
(só saíram da lista de seleção pra convites novos) pra não quebrar a
imagem de convites já compartilhados. Só `balada.jpg`/`viagem.jpg`/
`bike.jpg` foram apagados, confirmados sem uso real.
`show.jpg`/`futebol.jpg`/`praia.jpg`/`corrida.jpg` foram sobrescritos
com as fotos novas (mesmo nome de arquivo) — melhora retroativamente
até o evento real "Show do Deep Purple", que já usava `show.jpg`.

Cada preset em `lib/headers.ts` agora deriva seu tom pastel de fundo
(`bg`) da cor média da própria foto (script Python/PIL, clareado
~85% em direção ao branco), no lugar dos tons genéricos hardcoded
antigos. Commit `e414c24`, build limpo, push feito.

---

## Sessão 2026-08-19 (parte 6) — geração órfã, recuperação de pendente, 3 fixes de UI

Bug real relatado testando pra valer, às vésperas de disparar o
convite: "não acontece nada" gerando com uma foto específica, e "não
tem opção de recusar sem perder os créditos". Investigação nos dados
mostrou que **nenhuma cobrança tinha ficado sem geração correspondente**
— o problema era outro: a geração leva 15-25s de verdade, mais que os
"~15s" prometidos na tela, então a pessoa saía/recarregava achando que
travou, e quando a geração terminava (sim, ela termina — já cobrada),
ficava "órfã": sem tela pra aprovar ou recusar. Achei e devolvi 3
gerações reais nesse estado.

**Fix duplo**: `maxDuration = 60` na rota (margem de segurança contra
timeout de função serverless) + `GET /api/eventos/imagem-ia/pendente`
— o componente checa ao montar se existe uma geração pendente
esquecida (do evento, ou do usuário se ainda em `/criar`) e recupera
ela direto na tela de aprovar/recusar, em vez de deixar sumir. Testado
com uma geração pendente simulada, recuperou certinho.

**Mais 3 ajustes pedidos junto**:
- Botão "Transformar em pintura (3 créditos)" ficou cramado/feio —
  encurtado pra "Transformar (3 créditos)".
- Preview do WhatsApp: trocado "Clique em BORA para confirmar
  presença!" (não fazia sentido — BORA é RSVP, não é sobre ver
  detalhes) por "Dia DD/MM às HH:MM, clique para saber mais
  detalhes." — formato curto pro espaço limitado do preview.
- Card do evento: Local e link externo agora laranja por padrão
  (`text-brand`) e cinza no hover — antes era o contrário.

Commit `d911a9a`. Correção seguinte (`88e7913`): a cor só tinha
chegado na página pública real — o preview do painel/`/criar`
(`EventPreviewCard.tsx`) nem mostrava o link externo e tinha o Local
em cinza simples, por isso pareceu que "não mudou nada" ao conferir
por ali. Corrigido pra bater com a página real.

**Fechamento do dia**: produto testado ao vivo com convite real
("Encontro Agricultura Familiar e Ceagesp") — confirmações chegando,
árvore de convidados funcionando (nível 2 confirmado: Diego Oliveira
→ Claudio José Ferreira, vínculo correto). Árvore já tem
`overflow-x-auto` pra muitos nós de 1º nível — funciona (vira scroll
horizontal), mas com dezenas de confirmações diretas pode ficar
incômodo; não é urgente, registrado como possível melhoria futura
(quebrar em várias linhas ou virar lista com indentação).

---

## Sessão 2026-08-19 (parte 5) — descrição de cena vira opcional no modo "enviar foto"

Ajuste de UX sugerido pelo próprio Luciano: dos 3 modos de referência
(nenhuma / avatar / enviar foto), só os 2 primeiros fazem sentido
pedir "descreva o clima do evento" — no modo upload a cena já está
definida pela foto, pedir descrição de novo era redundante e podia
até confundir a geração (foto de uma coisa, descrição de outra).

Reordenado: escolha de referência vem primeiro, campo de texto vira
opcional e é reenquadrado como "instrução extra" (não descrição de
cena) no modo upload, botão vira "Transformar em pintura". Backend
aceita prompt vazio quando tem imagem de referência. Testado ponta a
ponta com prompt vazio pela rota real — funcionou, saiu bem ilustrado
e sem o texto da camisa que aparecia na foto original. Commit
`6245a0f`, push feito.

---

## Sessão 2026-08-19 (parte 4) — fix: repintura forte demais derrapava na identidade do rosto

Efeito colateral do fix da parte 3: forçar repintura completa da cena
inteira melhorou o estilo, mas também bagunçou a fidelidade do rosto
de quem estava na foto de referência — testado com a própria foto do
Luciano, saiu um rosto parecido mas não reconhecível (sinal de
nascença sumiu, proporções mudaram). "Se ele não tivesse
descaracterizado minha aparência, diria que estaria perfeito."

Corrigido separando as instruções: repintura agressiva só pro
ambiente/cenário (mantém a simplificação de detalhe repetitivo que já
funcionava bem), e instrução à parte, mais rígida, pedindo máxima
fidelidade no rosto — mesma técnica de pintura, mas sem alterar
proporções, marcas distintivas ou identidade. Validado com a foto real
(sinal de nascença voltou, formato do rosto bateu) tanto isolado
quanto pela rota real de produção. Commit `b82756d`, push feito.

---

## Sessão 2026-08-19 (parte 3) — fix: modelo tratava referência como filtro leve, não repintura

Bug real reportado testando de verdade: mandando uma foto de referência
bem cheia de detalhe (banca de feira lotada de verduras), o resultado
saía quase idêntico à foto original — tipo um filtro sutil por cima,
não uma ilustração de verdade. Comparação lado a lado confirmou.

Causa: o modelo fica conservador demais com referência de imagem em
cenas complexas — sem instrução explícita, prefere "levemente
retocar" a repintar. Corrigido pedindo explicitamente **repintura
completa, não filtro**, e simplificação de detalhe repetitivo
("agrupe formas e cores em pinceladas maiores, como um pintor faria
de longe", em vez de tentar preservar cada folha/objeto individual).
Validado com a mesma foto que expôs o bug (2 iterações até ficar bom)
e reconfirmado que não ficou exagerado numa foto simples de retrato.
Commit `9287dc8`, push feito.

---

## Sessão 2026-08-19 (parte 2) — foto de referência (upload) + estilo pintura digital semi-realista

Depois de testar em produção, o estilo "ilustração vetorial plana" da
parte 1 ficou cartoon demais (Luciano: "ficou desenho total"). Recalibrado
pra **pintura digital semi-realista** — sombreamento e profundidade,
claramente ilustrada mas sem virar cartoon de contorno grosso nem foto
real. Validado visualmente contra a referência real (`historia-hero.jpg`,
capa do "18 anos depois") antes de subir.

Também adicionada a opção de **enviar uma foto de referência** (do
local, de um grupo etc.), não só o avatar do perfil — pedido do
Luciano depois de eu confirmar por teste que o Gemini **não busca foto
real na web** sozinho (testei citando "Ceagesp": ele simula/inventa uma
cena genérica de mercado, não a arquitetura real do lugar). Testei
image-to-image com uma foto real do Ceagesp (Wikimedia, licença livre)
e com uma foto de grupo (6 pessoas) — os dois casos ficaram bem
reconhecíveis no estilo novo. Decisão explícita: **não** construir
busca automática de imagem na web (a maioria das fotos encontradas
numa busca comum não tem licença livre — risco de direito autoral pra
um produto comercial); construída a opção de upload de foto
própria em vez disso (`components/AiImageGenerate.tsx` ganhou um
seletor com 3 opções: nenhuma / avatar do perfil / enviar foto agora —
convertida pra base64 no cliente, decodificada no servidor). Testado
ponta a ponta pela rota real (gerar → aprovar → `bg_image_url`
atualizado → crédito debitado) com a conta real do Luciano.

---

## Sessão 2026-08-19 — aprovar/recusar imagem por IA, liberar no /criar, estilo ilustração, gate de data só no dia

Quatro ajustes pedidos ao vivo testando o produto de verdade pra um
evento real.

### Aprovar/recusar antes de virar capa
Gerar continua cobrando 3 créditos na hora, mas a imagem não vira mais
a capa automaticamente — mostra um preview com "Usar essa imagem" /
"Gerar de novo". Recusar devolve os 3 créditos e apaga o arquivo do
Storage; gerar de novo depois é cobrança nova (sem desconto de
segunda tentativa — decisão explícita do Luciano: mais simples que
"1 regeneração grátis" e sem risco de abuso). Tabela nova
`ai_image_generations` (status pending/approved/rejected, `event_id`
opcional) guarda cada geração até ser resolvida.

### Liberado também no `/criar`, não só na edição
Antes só existia no painel (`editToken` obrigatório). Como gerar tem
custo real de API — diferente de vídeo/foto, que não custam nada até
o upload — a cobrança acontece na hora mesmo antes do convite existir;
a imagem aprovada fica só no formulário local até a criação (mesmo
padrão do preset/crop-upload). Descoberto de brinde um bug preexistente:
o saldo exibido na tela sempre decrementava 1 crédito por upload, até
pra ação de 3 créditos — corrigido (`onUploaded(url, cost)` agora
propaga o custo real).

### Prompt sempre em estilo ilustração, nunca fingindo foto real
Motivo do Luciano: "imagens geradas por IA dão na cara que foram
geradas por IA" — o estilo fotorrealista que a IA tenta imitar é
exatamente o que soa artificial (pele lisa demais, luz esquisita).
Trocado pra sempre pedir ilustração digital/traço desenhado à mão,
com ou sem avatar de referência — mesma linguagem visual da capa
"18 anos depois" em toda geração, não só na opção de avatar.

### Gate de troca de data: só o dia conta, horário é sempre livre
Bug real encontrado testando com evento de verdade: o contador de
"troca de data" (1ª grátis, 2ª+ paga) contava troca de **horário**
junto com troca de dia — Luciano mudou só o horário e depois viu o
cadeado de 2 créditos aparecer, achando que não tinha usado a grátis
ainda. Corrigido nos dois lados (servidor em
`app/api/eventos/editar/route.ts` comparando só o dia civil no fuso
de São Paulo, e painel liberando o `TimePicker` sempre, fora do bloco
travado) — mudar só o horário nunca mais consome ou cobra.
Reproduzido/validado com script real batendo na API antes e depois do
fix; contador do evento real do Luciano resetado de volta pra 0 (a
troca dele tinha sido só de horário).

---

## Sessão 2026-08-18 (parte 7) — imagem por IA usando o avatar da pessoa (modo caricatura)

Evolução direta da parte 6: quando a pessoa gera imagem de cabeçalho
por IA e já tem avatar no perfil, aparece um checkbox opcional
"Incluir minha foto (vira uma ilustração estilo caricatura, tipo a
capa do '18 anos depois')". Marcando, a geração vira image-to-image — usa o
avatar como referência em vez de cena genérica sem ninguém
reconhecível, no mesmo espírito da capa da página "18 anos depois".

- **Técnico**: Vercel AI SDK aceita `prompt: { images: DataContent[],
  text: string }` além de string simples — busca os bytes do
  `avatar_url` (`fetch` + `Uint8Array`) e envia junto com o prompt de
  texto pedindo estilo "caricatura semi-realista". Sem avatar ou
  checkbox desmarcado, cai no prompt de texto puro de sempre (mesmo
  comportamento da parte 6).
- Custo/regra de crédito não mudam (3 créditos, sempre, mesmo gate).
- Testado ponta a ponta com dado real (avatar do Luciano, sessão e
  evento temporários, limpos ao final): resultado — caricatura
  reconhecível do rosto integrada numa cena de churrasco na laje, sem
  nenhum texto na imagem, aspect ratio 21:9 correto. Crédito debitado
  (-3), `bg_image_url` atualizado, `credit_transactions` registrada
  corretamente.
- Arquivos: `app/api/eventos/imagem-ia/route.ts` (parâmetro
  `includeAvatar`), `components/AiImageGenerate.tsx` (checkbox,
  só aparece se `hasAvatar`), `components/BgSelector.tsx` e
  `app/dashboard/[edit_token]/DashboardClient.tsx` (prop `hasAvatar`
  threaded a partir do avatar real do usuário).

---

## Sessão 2026-08-18 (parte 6) — preview do WhatsApp com foto real + imagem por IA

### Preview do WhatsApp mostra a foto de verdade do convite
`og:image` trocou de gerar um cartão à parte (gradiente + logo + texto)
pra apontar direto pra foto de cabeçalho real (preset ou upload
próprio). Título/data/local saíram da imagem — já iam como texto real
(`og:title`/`og:description`), estavam duplicados e poluíam a arte.
Rota `/api/og` removida (sem uso). Detalhes de UX do preview discutidos
e esclarecidos: WhatsApp só tem 1 slot de imagem (sem segunda imagem no
texto), fonte/tamanho/cor do texto são 100% do WhatsApp (zero controle
via Open Graph), descrição corta em ~2 linhas (ordem importa).

### Imagem de cabeçalho gerada por IA (3 créditos, sempre)
Quadradinho "✨ Imagem por IA" no `BgSelector` saiu do "em breve" e
ficou funcional no painel (`components/AiImageGenerate.tsx`, mesmo
padrão de cadeado/confirm de vídeo/foto/data). Pessoa descreve o clima
do evento em texto livre, gera e a imagem já vira o cabeçalho.

- **Stack**: Vercel AI SDK (`ai` + `@ai-sdk/google`), modelo
  `gemini-3-pro-image-preview` ("Nano Banana Pro"). Prompt combina
  título do evento + descrição da pessoa, pede explicitamente
  "sem nenhum texto, letra ou palavra escrita na imagem" (aprendido do
  problema que acabamos de corrigir no preview — não repetir arte
  poluída por texto).
- **Aspect ratio**: API só aceita uma lista fixa (`1:1`, `16:9`,
  `21:9`, etc.), não qualquer proporção arbitrária — usamos `21:9`
  (2.33:1), a mais próxima do 2.4:1 dos cabeçalhos do app.
- **Custo real validado antes de construir**: ~US$0,034–0,039/imagem
  (Gemini/OpenAI, pesquisado com preço atual, não estimado) contra
  R$3–6 de receita por 3 créditos — margem de 88%+ mesmo no pior
  cenário. Decisão de qual provedor usar (Gemini primeiro, porque já
  tinha conta pronta) documentada em [[project_vaikeuvou]].
- **Setup de billing teve 2 obstáculos reais** (não só "colar a
  chave"): (1) cota do nível gratuito é zero pra modelos de imagem,
  precisa vincular faturamento; (2) a cobrança do Gemini é
  **pré-paga** (carteira, não cartão pós-pago), precisa carregar
  saldo separadamente. Descoberto testando de verdade, não documentado
  claramente pelo Google.
- Testado de ponta a ponta com a API real (créditos pré-pagos
  carregados) e com o banco de produção: geração, upload pro
  Storage, débito de crédito, rejeição por saldo insuficiente — tudo
  validado. Chave em produção (Vercel) adicionada pelo próprio Luciano.

### Decisão: multi-domínio pro/social ABANDONADA
Luciano e Sandro decidiram, depois de uma reunião, não seguir com dois
domínios/tons (`pro.vaikeuvou.app` vs `vaikeuvou.app`) — mantém só uma
versão. Argumento do Sandro: "vaikeuvou é o que é", a marca é
BORA/"Vamo aí?" pra qualquer público, vaikeuvou é pra pessoas, não pra
empresas. Ajuste que sobrou: evitar vocabulário de festa específico
("rolê", "balada", "galera") na copy, mantendo BORA/cor/identidade
intactos — Sandro vai enviar a marca em formato quadrado pro preview,
as 10 imagens de header definitivas, e ajustes de design. Detalhe
completo em `~/.claude/projects/-Users-lucianomaeda/memory/vaikeuvou_multidominio_pro.md`
(memória, não repo — é uma decisão de produto, não código).

---

## Sessão 2026-08-18 (parte 5) — 🚀 PRODUÇÃO: Stripe live, Pix solicitado, branding, e-mail

**vaikeuvou.app está oficialmente em produção, aceitando pagamento real.**

### Stripe: teste → produção
- Chave restrita **live** criada pelo Luciano e configurada no Vercel
  (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` de produção) — webhook
  live registrado apontando pra `https://vaikeuvou.app/api/webhooks/stripe`.
- **Bug no meio do caminho**: as duas variáveis foram salvas vazias no
  Vercel na primeira tentativa (edição via Dashboard não gravou o
  valor) — diagnosticado comparando o comprimento do valor puxado via
  `vercel env pull` contra uma variável de controle que sabíamos ter
  valor real (mesmo resultado vazio nas duas, confirmando bug na
  gravação, não no meu método de checagem). Resolvido excluindo e
  recriando as duas variáveis do zero.
- **Validado com compra real**: R$19,90 (pacote de 10 créditos) via
  cartão do próprio Luciano — `stripe_session_id` com prefixo `cs_live_`
  confirmando modo produção, crédito caiu certinho (5→15). Redeploy
  disparado antes do teste (variável de ambiente só afeta deployments
  futuros no Vercel, não os já publicados).

### Pix — solicitado, aguardando aprovação
Pix pra contas Brasil no Stripe é **por convite**, não é toggle livre
no Dashboard (achado direto na documentação oficial, depois de
"não aparece Pix" ser investigado). Luciano já deixou o e-mail no
formulário de solicitação do Stripe. **Nenhuma mudança de código
necessária** quando aprovar — o checkout já omite `payment_method_types`
(dynamic payment methods), então o Pix aparece sozinho assim que for
ativado no Dashboard.

### Branding do Checkout
Antes aparecia "SAACS" na tela de pagamento (nome antigo herdado da
conta Stripe) — trocado pro nome público "vaikeuvou", ícone quadrado
laranja (mesmo arquivo do favicon, copiado também pra
`Vaikeuvou/logos e botoes/icone_stripe_512.png` como referência), cor
da marca `#E36811`, e o "Statement descriptor" (nome que aparece na
fatura do cartão do cliente) também ajustado.

### Recibo por e-mail + captura do e-mail do comprador
- Ativado "Pagamentos concluídos" nas configurações de e-mail do
  Stripe — recibo automático pra toda venda a partir de agora
  (não retroage pra pagamentos já feitos antes de ligar).
- **`users.email` passou a ser preenchido de verdade**: o Checkout do
  Stripe sempre coleta e-mail na tela de pagamento, mas o webhook só
  usava isso pra nada — agora grava em `users.email` (coluna que já
  existia no schema, nunca populada, já que login é telefone+OTP sem
  e-mail). Testado com webhook assinado localmente.
- **Domínio próprio pro envio de e-mail do Stripe**: registros SPF e
  DKIM adicionados, e DMARC (`_dmarc.vaikeuvou.app`, `p=none` —
  modo monitoramento, seguro pra começar) — aguardando validação
  automática do Stripe.

### Pendências
1. Pix — aguardando aprovação do Stripe.
2. Validação do DMARC pelo Stripe (automática, só esperar).
3. Decidir o que fazer com os créditos de teste acumulados na conta
   do Luciano (ficar com eles ou pedir reembolso da compra real).

---

## Sessão 2026-08-18 (parte 4) — troca de data paga, Meus convites separados, eventos passados travados

### Motor de créditos: troca de data (2ª em diante)
Regra combinada com o Luciano: **1ª troca de data é grátis** (faz
sentido pra adiar um evento), **da 2ª em diante custa 2 créditos por
troca**, pra sempre. Mesmo padrão visual já usado em vídeo/foto: campo
trava (cadeado + `CreditLockPanel`) depois da troca grátis ser
consumida. Implementação:
- `events.date_changes_count` (novo, `supabase_data_credits.sql`) —
  contador simples, nunca reseta.
- `/api/eventos/editar`: sempre que `event_date` muda de verdade
  (compara timestamps via `Date.getTime()`, não string crua — evita
  falso positivo por notação de timezone diferente entre o que o
  Postgres devolve e o que o cliente manda), incrementa o contador.
- `/api/creditos/desbloquear-data` (novo): cobra 2 créditos, mesmo
  padrão dos outros endpoints de desbloqueio (sessão, ownership,
  `debit_user_credits`, log em `credit_transactions`).
- `DashboardClient.tsx`: campo Data/Horário mostra normal enquanto
  `date_changes_count === 0` (com aviso "1ª troca é grátis..."), trava
  depois disso — clicar em "Alterar data" abre o `CreditLockPanel` de
  confirmação antes de liberar os campos pra edição.

### "Meus convites" separado: Vai acontecer / Já aconteceu
Duas queries independentes (`event_date >= now()` ascendente vs `<
now()` descendente), cada uma com sua própria paginação
(`?futuro=N&passado=M`). Cards de eventos passados ganham badge
"Encerrado".

### Painel e link público de eventos passados
No painel (`/dashboard/[edit_token]`), evento com `event_date` no
passado: sem botão "Editar convite", sem link/compartilhar (vira um
aviso "Convite encerrado — não é mais possível compartilhar ou
editar"), preview do card mascarado com "Esse evento já aconteceu."
sobre uma versão desfocada do card real. **Mesma máscara aplicada na
página pública `/e/[slug]`** — cobre o caso de um link já compartilhado
continuar circulando depois do evento (o pedido explícito do Luciano:
"importante também colocarmos a máscara em links vencidos que
circulam"). A confirmação de presença (BORA) fica bloqueada também via
guarda no `confirmar()`, não só visualmente.

### Como foi validado
Testado com dado real de ponta a ponta: 1ª troca de data grátis
(inclusive numa conta com saldo zero), 2ª troca cobrando 2 créditos
corretamente, rejeição 402 com saldo insuficiente. `/meus-convites`
conferido com eventos futuros e passados reais, badge aparecendo
certo. Painel e página pública de evento passado testados via
screenshot real (CDP do Chrome, sessão autenticada) — sem "Editar
convite", sem compartilhar, máscara aparecendo nos dois lugares. Todo
dado de teste (eventos, transações, sessões) removido depois, saldo de
créditos revertido ao valor original. `npm run build` limpo em cada
etapa.

---

## Sessão 2026-08-18 (parte 2) — página "18 anos depois", última pendente de conteúdo

Mesmo layout de capa da "Como funciona?" (logo → foto retangular → título
grande, via `heroImage` do `InfoPageShell`) — reaproveitando a mesma foto
provisória (galera reunida) até o Luciano indicar a definitiva pra essa
página especificamente. Texto completo fornecido por ele: a origem do
vaiqueuvou.com em 2008 (Incubadora de Santos), o desvio de foco pra virar
rede social estilo MySpace, o fracasso, a metáfora do whisky Single Malt
18 anos maturando no barril, e o relançamento em 2026 como vaikeuvou.app.
Fecha com "Vamo aí?" (mesmo estilo do card de convite) e assinatura no
mesmo padrão usado nos convites — avatar, nome, bio, Instagram (dados
reais do perfil do Luciano, hardcoded nesta página por ser conteúdo
autoral fixo, não dependente de quem está logado).

**Com isso, todas as 5 páginas institucionais (Termos, Privacidade, Como
funciona, Fale conosco, 18 anos depois) têm conteúdo real — não sobra
nenhum stub em branco no app.**

### Como foi validado
Build limpo. Screenshot real via Chrome headless conferindo o layout
completo (hero, texto, assinatura).

---

## Sessão 2026-08-18 (parte 3) — acabamentos: fotos definitivas, simetria, padronização

Sequência de ajustes finos pedidos ao vivo depois da parte 2:
- **Foto definitiva do "18 anos depois"**: troca a foto provisória por
  uma ilustração fornecida pelo Luciano (ele no home office, tema
  código+valores+praia). Assinatura perdeu o avatar (repetia a foto de
  cima) — ficou só nome + bio + ícones de Instagram e LinkedIn (sem
  texto do link ao lado). Bio ganhou "Aprendiz de Filósofo" depois de
  "Cofundador vaikeuvou" — atualizado também no perfil real dele
  (`users.bio`), não só nesta página, pra refletir em convites futuros.
- **Simetria de espaçamento**: no layout de capa (`InfoPageShell`
  `heroImage`), o espaço entre a foto e o título e entre o título e o
  primeiro parágrafo ficou igual (`mb-8` nos dois, antes a foto tinha
  só `mb-6`) — afeta as duas páginas que usam esse layout.
- **Padronização das 3 páginas restantes**: Termos, Privacidade e Fale
  conosco ganharam o mesmo layout de capa das outras duas, com fotos
  temáticas do Unsplash (licença gratuita): aperto de mão sobre
  documentos assinados (Termos), cadeado sobre teclado (Privacidade),
  pessoa sorrindo no laptop (Fale conosco — trocada de uma opção mais
  séria/escura pra combinar com o tom do app). Com isso as 5 páginas
  institucionais seguem o mesmo padrão visual completo.

### Como foi validado
Build limpo a cada etapa. Screenshot real conferindo cada foto aplicada
e a simetria de espaçamento nas duas páginas afetadas.

---

## Sessão 2026-08-18 — ajuste no checkbox de termos, página Fale conosco, auto-resposta no WhatsApp

### Fix: espaço duplo/quebra estranha no checkbox de Termos (`/criar`)
O `<label>` do aceite de Termos/Privacidade usa `flex`; como os dois `<a>`
apareciam soltos entre o texto, cada trecho virava um item flex separado
(ganhando o `gap` do flex além do espaço normal do texto) — daí o espaço
duplo no desktop e a quebra em blocos no mobile. Fix: envolver a frase
inteira num `<span>` (único item flex ao lado do checkbox). Depois,
reduzido `gap-2.5` → `gap-1.5` (estava descolado). Validado com
screenshot real via CDP do Chrome (sessão autenticada), desktop e mobile.

### Página "Fale conosco" (antes stub em branco)
Sem WhatsApp de atendimento (decisão do Luciano: vira "insuportável" sem
IA por trás) — canal é e-mail (`fale@vaikeuvou.app`, link direto) +
formulário por assunto (Dúvidas/sugestões, Reclamações, Cancelamento de
conta, Parcerias, Outros). Sem serviço de e-mail configurado ainda no
projeto (nem Resend nem nada) — formulário grava numa tabela nova
`contact_messages` no Supabase (`supabase_fale.sql`), consultada direto
no Table Editor por enquanto. FAQ repetida da página "Como funciona?" —
extraída pra `lib/faq.ts` compartilhado, evita duplicar texto que
precisaria sincronizar manualmente. Rodapé com razão social e CNPJ
(mesmo padrão da Política de Privacidade) — endereço completo deixado de
fora por prudência (hoje é o único ponto físico de operação do
vaikeuvou, expor no contato público é exposição sem necessidade real).

### Webhook do Evolution API: resposta automática apontando pro Fale conosco
Quem responder/mandar mensagem pro número que envia os códigos de OTP
(`+55 11 91017-2081`, perfil "Lorelai") recebe um aviso automático fixo
(não é chatbot, não conversa) direcionando pra `/fale`. Cooldown de 24h
por número (tabela `whatsapp_autoreplies`) pra não parecer bot repetitivo
numa ida-e-volta. Ignora mensagens enviadas por nós mesmos (`fromMe`,
evita loop com o próprio envio de OTP), grupos e broadcast.

**Payload e endpoint confirmados direto no código-fonte oficial**
(github.com/EvolutionAPI/evolution-api, v2.3.7 — a versão rodando na
VPS): `POST /webhook/set/{instance}` com corpo `{ webhook: { enabled,
url, events, byEvents, base64, headers } }`, evento `MESSAGES_UPSERT`.

**Bug real encontrado e corrigido no caminho**: a primeira tentativa de
autenticar o webhook comparava com o campo `apikey` que a Evolution ecoa
no corpo — mas esse campo é o **token da própria instância**
(`this.token`, diferente da chave global usada pra chamar a API dela), e
só vem preenchido se uma config do servidor (`EXPOSE_IN_FETCH_INSTANCES`)
estiver ligada. Resultado: todo webhook chegava e levava 401 da nossa
própria rota. Diagnosticado direto nos logs do container na VPS (`docker
service logs evolution_evolution`, com autorização do Luciano pra acessar
via SSH) — o log mostrava exatamente `"Request failed with status code
401"` bem na entrega. Corrigido trocando pra um header customizado
(`X-Evolution-Secret`) configurado no próprio `webhook/set`, que a
Evolution reenvia como header HTTP de verdade. Testado com mensagem real
do WhatsApp do Luciano — confirmado no log da VPS (sem erro), na tabela
`whatsapp_autoreplies` (registro gravado) e na resposta recebida de
verdade no celular dele.

### Como foi validado
Build limpo em cada etapa. Termos: screenshot real via CDP headless
(sessão autenticada). Fale conosco: envio real via `curl`, checado no
Supabase, dado de teste removido. Webhook: teste real de ponta a ponta
com o WhatsApp do Luciano — sem simulação de payload sintético pra
número de terceiro (bloqueado pelo próprio classificador de segurança,
corretamente, por ser uma ação com efeito real num número não
verificado).

---

## Sessão 2026-08-17 (parte 4) — acabamentos finais: raio da foto hero e favicon

Dois ajustes rápidos pra fechar o dia. **Raio da foto do "Como funciona?"**
corrigido de `rounded-2xl` (16px) pra `rounded-lg` (8px) — padrão usado em
todo o resto do app (card do convite, vídeo embed, preview). **Favicon**
trocado: era o ícone padrão do `create-next-app`/Vercel (triângulo preto
num círculo), agora é o ícone quadrado laranja da marca, recortado do
`logo-vertical.png` (bounding box 133×133 do ícone dentro do arquivo,
com pequena margem) e gerado nos três formatos que o Next.js App Router
reconhece: `app/favicon.ico` (16/32/48), `app/icon.png` (512, navegadores
modernos) e `app/apple-icon.png` (180, tela inicial iOS). Validado via
build (rotas `/icon.png` e `/apple-icon.png` aparecem geradas) e via
`curl` conferindo as tags `<link rel="icon">` no `<head>` renderizado.

---

## Sessão 2026-08-17 (parte 3) — Como funciona?, LGPD, Termos e Privacidade

### Página "Como funciona?" (antes stub em branco)
Construída do zero, didática: intro curta, 3 passos (criar → compartilhar
→ acompanhar), bloco verde "sempre grátis", cards âmbar do que usa crédito
(vídeo 1, foto 1, ver quem vai 3, IA 3 — em breve, puxando preço real de
`CREDIT_PACKAGES`), FAQ em acordeão (`<details>`, sem JS) linkando pro
Fale conosco, dois CTAs "Comprar créditos →". Depois ganhou um hero:
`InfoPageShell` recebeu prop opcional `heroImage` — quando presente, troca
o breadcrumb padrão por logo em cima → foto retangular 2.4:1 → título
grande centralizado. Foto (galera sorrindo, clima BORA) via Unsplash,
licença livre, salva em `/public/como-funciona-hero.jpg` — usada só nessa
página, as outras (Termos, Privacidade, Fale) continuam com o breadcrumb
padrão.

### LGPD — coleta de telefone, consentimento e documentos legais
Discussão com o Luciano sobre como sinalizar consentimento pra coleta de
telefone (login do anfitrião via OTP, e nome+telefone no RSVP do
convidado). Decisão: **dois níveis**, não um só —
- **`/criar`, checkbox explícito** (opt-in, desmarcado por padrão),
  bloqueia "Criar convite" até marcar. Só aparece na primeira vez — grava
  `terms_accepted_at` (nova coluna em `users`, `supabase_termos.sql`) e
  nunca mais pergunta depois disso.
- **`/login` e RSVP (botão BORA)**: texto passivo com links, sem checkbox
  — são os instantes em que o telefone já está sendo processado (OTP) ou
  é o gesto mais importante do produto (BORA); um checkbox bloqueante ali
  derrubaria conversão sem ganho real de proteção jurídica (a base legal
  é execução do serviço, não consentimento formal).

Termos de Uso e Política de Privacidade escritos de verdade (antes eram
stubs em branco), baseados no que o app **realmente** coleta e faz — não
em texto genérico de gerador de política. Responsável pelo tratamento:
Luciano Maeda Estratégia Empresarial LTDA, CNPJ 44.636.556/0001-44
(cartão CNPJ fornecido pelo Luciano). Contato: fale@vaikeuvou.app. A
Política lista os processadores reais (Stripe, Evolution API/WhatsApp,
Supabase, Vercel), os direitos do titular (LGPD Art. 18) e como exercê-
los (Fale conosco) — sem prometer nada que o produto não faz de verdade
hoje (ex: reembolso e exclusão de conta são manuais, via Fale conosco,
não têm self-service ainda).

### Como foi validado
Como funciona: screenshot real do dev server (desktop), build limpo.
LGPD: SQL rodado pelo Luciano (`supabase_termos.sql`), depois validado
ponta a ponta com sessão de teste temporária na conta real dele —
checkbox aparece pra quem nunca aceitou, POST `/api/perfil` com
`accept_terms:true` grava `terms_accepted_at` de verdade, checkbox some
depois de aceitar. Estado revertido ao final (`terms_accepted_at` voltou
pra `null` — ele ainda não aceitou de verdade). `npm run build` limpo em
cada etapa.

---

## Sessão 2026-08-17 (parte 2) — motor de créditos: vídeo e foto cobram também na criação

Correção de regra de negócio sobre a 2ª leva do motor de créditos (vídeo,
upload de foto de cabeçalho, "Ver quem vai"): a versão anterior cobrava só
na troca, com a primeira vez (na criação do convite) grátis. Luciano
corrigiu explicitamente: **não existe "primeira grátis"** — vídeo e foto
própria custam 1 crédito **toda vez que são definidos**, inclusive a
primeira, já em `/criar`. Só a edição de um valor existente é chamada de
"troca" (mesmo preço, 1 crédito, sem desconto).

### Feito
- `app/api/eventos/imagem-cabecalho/route.ts`: removida a checagem
  `isFirstUpload` — sempre debita 1 crédito antes do upload, devolve o
  crédito se o Storage falhar.
- `components/HeaderImageCropUpload.tsx`: reescrito como máquina de estados
  `idle → confirmTroca → crop` — o aviso de custo ("vai debitar 1 crédito")
  aparece **antes** de abrir o seletor de arquivo, não depois de já ter
  recortado a foto (feedback explícito do Luciano: "imagino que eu faço as
  coisas pensando que é gratuito e só depois avisa"). Removida a variante
  verde "grátis"; agora é sempre o quadradinho âmbar com cadeado.
- `components/BgSelector.tsx`: quadradinho "✨ Imagem por IA" ganhou nota
  "Em breve · 3 créditos"; removido o prop `currentValue` (não fazia mais
  sentido sem a distinção primeira-grátis).
- `app/criar/CriarClient.tsx`:
  - Campo de vídeo agora nasce **travado** (botão "🔒 Adicionar vídeo — 1
    crédito"); só vira `<input>` normal depois que a pessoa reconhece o
    aviso.
  - Upload de foto de cabeçalho: como o convite ainda não existe no
    momento do recorte, o blob fica pendente em memória
    (`pendingHeaderImage`) — o upload de verdade (e o débito) só acontece
    **depois** que o convite é criado, reaproveitando o `edit_token` da
    resposta.
  - Ao clicar em "Criar convite", se algum item pago foi preenchido
    (vídeo e/ou foto), aparece **um único `confirm()` com o total**
    ("vai debitar 2 créditos... vídeo + foto. Confirma?") antes de
    prosseguir — em vez de vários avisos separados.
  - Bug pré-existente corrigido no caminho: `POST /api/eventos` (criação)
    descartava silenciosamente `video_url`/`external_url`/
    `external_url_label` — só `PATCH /api/eventos/editar` (edição)
    persistia esses campos. Corrigido; validado criando evento real com
    vídeo+link externo e conferindo persistência.
- `app/dashboard/[edit_token]/DashboardClient.tsx`: `window.confirm()`
  adicionado antes de debitar (vídeo e "Ver quem vai"), simplificado o
  callback de upload de imagem (sempre debita, sem branch de "grátis").

### Como foi validado
Sessão de teste temporária (token direto na tabela `sessions`, conta real
do Luciano, 8 créditos) rodando contra o dev server local: criei um
convite via API simulando exatamente a sequência do `/criar` (criar
evento → debitar vídeo → PATCH salvando `video_url` → upload de imagem
1200×500 debitando 1 crédito) — confirmado no banco que `video_url` e
`bg_image_url` ficaram persistidos e exatamente 2 créditos foram
debitados (8→6), com as duas linhas em `credit_transactions`. Testado
também o caminho de saldo insuficiente com uma segunda conta (0
créditos): os dois endpoints retornam 402 sem debitar. Saldo e dados de
teste revertidos ao final (créditos devolvidos, evento e arquivo no
Storage apagados, sessões de teste removidas). `npm run build` limpo.
Commit `686b5c6`, push feito, deploy automático via Vercel.

### Pendências que restam
1. Motor de créditos: falta só a regra "2ª mudança de data (2 créditos)",
   que não foi pedida nesta leva — não implementada.
2. Feature de imagem gerada por IA (3 créditos) ainda não existe — só o
   quadradinho "em breve" está no lugar.
3. 10 imagens de header ainda placeholder (Picsum) — Sandro entrega as
   definitivas.

---

## Sessão 2026-08-17 — design system de botões + menu de bolinhas + OG image

### Padronização de botões (padrão oficial = o botão BORA)
Todos os botões de ação do app (login, meus convites, painel, perfil,
confirmação do convite) passaram a seguir o formato do BORA: **caixa
alta + ícone à direita**, mantendo a cor/hierarquia de cada um (laranja
= ação principal, branco/borda = secundária, cinza = neutra). WhatsApp
verde ficou intocado (reconhecimento de marca, não inconsistência).
Emojis que estavam à esquerda do texto ("✏️ Editar convite", "✏️
alterar") foram trocados por SVGs monocromáticos posicionados à direita,
herdando a cor do texto via `currentColor` (branco em botão laranja,
cinza em botão neutro). Seletores tipo radio (privacidade em /criar e
/dashboard) e setas de paginação ficaram fora do escopo — não são
"botões de ação" no mesmo sentido do BORA.

### Menu de bolinhas reorganizado (`components/AppHeaderNav.tsx`)
O popover de perfil, que antes só tinha avatar/nome + "Créditos: Em
breve" + Editar perfil + Sair, ganhou estrutura completa em blocos
separados por divisor:
- **Navegação**: Meus convites, Criar convite
- **Créditos**: card destacado (fundo laranja diluído) com saldo + botão
  "Comprar créditos" desabilitado ("em breve" — motor de créditos ainda
  não existe) + link "Como funciona?" logo abaixo (explica o modelo,
  por isso fica junto dos créditos, não no bloco de suporte)
- **Perfil**: Editar perfil (como já estava)
- **Suporte**: Fale conosco
- **Sair** (separado por linha, como antes)

Isso resolve uma pendência antiga: "Como funciona?" e "Fale conosco"
existiam como páginas em branco desde a sessão de padronização visual,
mas sem link nenhum — agora estão acessíveis.

### OG image redesenhada (`app/api/og/route.tsx`) — última tela escura do app
Era o último lugar do app ainda no visual escuro/gradiente-por-hash
antigo. Mesma estrutura (logo em cima, título+data+local no meio, CTA
embaixo), pele nova:
- Fundo: gradiente laranja mais forte que o pastel dos cards (branco →
  laranja médio, 135deg), no lugar do gradiente escuro por hash do
  título.
- Logo horizontal real (`/logo.png`) no lugar do texto "vaikeuvou.app".
- Data agora mostra data completa + horário (reaproveita `fmtDate`, o
  mesmo formatador do resto do site) — antes só tinha dia/mês abreviado.
- CTA "E aí? Vamos? 🚀" virou **"Vamo aí?" dentro de um botão laranja
  sólido, caixa baixa, sem ícone** — decisão consciente de não seguir o
  padrão caixa-alta+ícone dos outros botões, porque "Vamo aí?" é a mesma
  frase solta (não-botão) que aparece no card real; aqui vira botão só
  porque a imagem estática não tem como ter um BORA clicável de verdade.
- Removido `lib/gradient.ts` (código morto — a rota tinha sua própria
  cópia inline da mesma lógica de hash, nada mais importava o arquivo).

**Com isso, não sobra nenhuma tela ou asset do app no visual escuro
antigo — a padronização visual está 100% completa**, incluindo o preview
do link no WhatsApp.

### Como foi validado
Botões: build limpo + checado via sessão real em /login, /meus-convites,
/dashboard e /perfil (curl com cookie de sessão). Menu: popover forçado
aberto temporariamente (`HeaderPopover` `useState(true)`) pra
screenshot mobile fullscreen e painel desktop, revertido antes do
commit. OG image: gerada de verdade via curl com dados de um evento
real, e confirmado que a rota do evento monta a URL do OG com data+
horário completos.

### Pendências que restam
1. Motor de créditos real (saldo, Stripe, débito por ação) — quando
   existir, precisa gatear "Ver quem vai" e a lista "Confirmados" do
   painel, e ativar o botão "Comprar créditos" do menu
2. 10 imagens de header ainda placeholder (Picsum) — Sandro entrega as
   definitivas

---

## Sessão 2026-08-16 (parte 6) — ajuste fino: assinatura no rodapé, botão BORA

Dois acabamentos pequenos, pedidos ao vivo depois de ver a parte 5 no ar.

### Feito
- **Assinatura reorganizada** (`EventoClient.tsx` + `EventPreviewCard.tsx`):
  o layout da parte 5 misturava nome/bio/instagram no bloco ao lado da
  foto de 100px do anfitrião, competindo com o recado do evento
  (`description`). Luciano não gostou — revertido: **ao lado da foto
  fica só o recado** (comportamento de antes da parte 5). Bio e Instagram
  **mudaram pro rodapé** da página: "Organizado por Nome" → bio numa
  linha abaixo → ícone do Instagram embaixo da bio, linkando pra
  `instagram.com/<handle>` em nova aba. Mesmo ajuste replicado no preview
  compacto (`EventPreviewCard`, usado em `/criar` e no painel).
- **Botão de confirmação invertido**: era "Confirmar [BORA]", virou
  "[BORA] Confirmar" — a imagem BORA+ícone agora vem antes do texto
  "Confirmar", não depois.

### Como foi validado
Assinatura: testado de novo com bio/instagram reais preenchidos
temporariamente na conta do Luciano (script + screenshot), confirmando
que o recado fica isolado ao lado da foto e a assinatura completa aparece
no rodapé — revertido depois (perfil real dele segue com bio/instagram
`null`, ele ainda vai preencher em `/perfil`). Botão BORA: só revisão de
código + build limpo — clique programático não é confiável no Chrome
headless local pra esse fluxo (limitação de ferramenta já documentada em
sessões anteriores, não vale re-investigar), Luciano confere no celular.

---

## Sessão 2026-08-16 (parte 5) — bio, Instagram e "vibe" no perfil

Ideia do Luciano: a assinatura "organizado por Nome" no convite fica pobre
sem mais nada — queria bio + @instagram junto do nome, e um terceiro campo
("qual é sua vibe? o que gosta/não gosta de fazer") que não aparece no
convite, é só pra uma futura IA geradora de imagem entender o estilo do
usuário.

### Feito
- **`users` ganhou 3 colunas** (`supabase_perfil_bio.sql`, `ALTER TABLE
  ... ADD COLUMN IF NOT EXISTS` — já rodado pelo Luciano): `bio`, `vibe`,
  `instagram`, todas opcionais.
- **`/perfil`**: campos novos (Bio, limite 140 chars; Instagram, prefixo
  `@` fixo no input; "Qual é a sua vibe?", textarea livre), cada um com
  uma linha explicando pra que serve — a de vibe deixa claro que **não**
  vai pro convite. Nome+bio+instagram+vibe agora salvam juntos num único
  botão "Salvar perfil" (antes só o nome tinha save próprio).
  `app/api/perfil/route.ts` normaliza o Instagram no backend (aceita
  `@handle`, URL colada ou texto puro, guarda só o handle limpo).
- **Banner "Capriche na sua assinatura!"** — laranja, não-bloqueante,
  aparece em `/perfil` (quando falta foto/bio/instagram) e em `/criar`
  (mesma condição, com link "Completar perfil →"). Decisão: nudge em vez
  de gate — travar o onboarding pra forçar isso brigaria com o pós-login
  inteligente que já manda o usuário direto pra `/criar`.
- **Assinatura em produção**: `EventPreviewCard` (preview do `/criar` e
  do painel) e `EventoClient` (página real do convite, `/e/[slug]`) agora
  renderizam `Nome · @instagram` + bio numa linha abaixo, mantendo o
  recado do evento (`description`) como já era — os três nunca competem
  pelo mesmo espaço, cada um sua linha.

### Como foi validado
Testado contra a conta real do Luciano: preenchi bio+instagram de teste
via script, tirei screenshot da assinatura completa no convite real
("Luciano · @lucianomaeda" + bio + recado do evento, todos exibidos
juntos corretamente), depois revertido pra `null` (estado real dele hoje
— ele ainda não preencheu esses campos). Confirmado também que o banner
de nudge aparece tanto em `/perfil` quanto em `/criar` quando o perfil
está incompleto.

---

## Sessão 2026-08-16 (parte 4) — /login, /login/verificar e /perfil pro tema claro

**Última área do app ainda no visual escuro/roxo original — convertida.**
Todas as páginas agora seguem o mesmo padrão visual (fundo branco, inputs
com borda cinza + foco laranja/`brand`, botões laranja, `AppFooter`).

- `/login` e `/login/verificar`: logo clicável (volta pra home) + rodapé
  padrão, mesmo layout centralizado de antes, só trocando `violet-*` por
  `brand`/`brand-dark`.
- `/perfil`: passou a usar `InfoPageShell` (o mesmo header com breadcrumb
  + `ProfilePopover` + rodapé usado em `/historia`, `/termos` etc.) —
  `PerfilClient.tsx` virou só o conteúdo (avatar/crop/nome), sem duplicar
  wrapper de página. Fluxo de crop de avatar (canvas, zoom, drag) não foi
  tocado, só as cores.
- Redirects pro `/login` em `/meus-convites` e `/perfil` agora incluem
  `?next=` também, consistentes com o pós-login inteligente implementado
  na parte 3.
- Validado: build limpo, `curl` com sessão real confirmando ausência de
  qualquer classe `violet-*`/`bg-gray-950`/`bg-gray-900` remanescente em
  `app/login` e `app/perfil`.

**Com isso, a padronização visual completa do app está concluída** — não
resta nenhuma página no tema antigo.

---

## Pós-login inteligente (parte 3, adicionado depois)

Investigando o fluxo "cheguei na home sem convite, cliquei em Criar
convite", achamos um atrito: `/criar` exigia login, mas depois do OTP o
redirect ia sempre pra `/meus-convites` (vazio), obrigando um clique extra
até chegar de fato em `/criar`.

Corrigido com pós-login inteligente:
- Rotas protegidas (`/criar`, `/meus-convites`) redirecionam pro login com
  `?next=<rota original>`; o login carrega esse `next` por toda a jornada
  (`/login` → `/login/verificar` → pós-OTP) e volta exatamente pra lá.
- Sem `next` (login "solto", não veio de um CTA específico): decide pelo
  estado do usuário — `/api/auth/verificar-otp` agora retorna `hasEvents`;
  sem nenhum convite ainda → `/criar` (primeiro passo natural); já tendo
  convites → `/meus-convites`.
- Arquivos: `middleware.ts`, `app/criar/page.tsx`, `app/login/page.tsx`,
  `app/login/verificar/page.tsx`, `app/api/auth/verificar-otp/route.ts`.

---

## Sessão 2026-08-16 (parte 3) — dashboard convertido, árvore de convidados, paginação

### Feito
- **Header consolidado**: ícone de menu (grade de bolinhas) e avatar de
  perfil viraram um só — o ícone de bolinhas agora abre o `ProfilePopover`
  (nome, créditos "Em breve", editar perfil, sair). `MenuPopover` e sua
  lista `PAGINAS` foram removidos de `AppHeaderNav.tsx`.
- **Rodapé padronizado em todas as páginas** (`components/AppFooter.tsx`):
  "18 anos depois" · "Termos de uso" · "Política de Privacidade". "Almoço
  grátis" foi removido (risco de leitura como cupom promocional num
  contexto de eventos) e virou o conceito "Como funciona?" — junto com
  "Fale conosco", fica pro menu de bolinhas mais adiante, ainda não
  linkado em lugar nenhum. Criadas as páginas-stub (header+rodapé, conteúdo
  em branco, `InfoPageShell.tsx`, `max-w-5xl`): `/historia`, `/termos`,
  `/privacidade`, `/fale`, `/como-funciona`.
- **Home**: regressão visual corrigida — o ícone de perfil empurrou o bloco
  logo→botão pra baixo no desktop; recentralizado via flex (mobile não
  alterado).
- **`/dashboard/[edit_token]` inteiro reconstruído** (`DashboardClient.tsx`)
  — era a última página em tema escuro/layout antigo, agora segue o padrão:
  - `EventPreviewCard`, `BgSelector` e o tipo `EventFormFields` foram
    extraídos do `/criar` (`components/EventPreviewCard.tsx`,
    `components/BgSelector.tsx`, `lib/eventForm.ts`) pra reuso nos dois
    lugares.
  - Edição completa de todos os campos (antes só 3), pré-preenchidos,
    botão Salvar com dirty-state (desabilitado até algo mudar).
  - **O formulário de edição agora fica recolhido por padrão**, atrás de
    um botão "✏️ Editar convite"; abre as 2 colunas (form+preview, igual
    ao `/criar`). "Fechar ✕" em laranja, colado no label "Editar convite".
  - Bloco antigo "link do painel (salve!)" eliminado (não fazia mais
    sentido com auth).
  - Bloco "Nenhuma confirmação ainda" removido — a seção "Confirmados"
    simplesmente não renderiza quando não há RSVPs (os cards de estatística
    já cobrem esse estado).
  - `allowed` em `app/api/eventos/editar/route.ts` estava faltando
    `max_depth` — edição de privacidade nunca persistia, corrigido.
  - **Bug de timezone corrigido**: `parseEventDate` fazia regex ingênuo na
    string UTC crua; horário salvo em -03:00 (ex: 21:00) aparecia deslocado
    (00:00 do dia seguinte) ao reabrir o form. Reescrito com
    `Intl.DateTimeFormat(timeZone: 'America/Sao_Paulo')`, mesmo padrão já
    usado em `lib/slug.ts`.
- **Nova página `/dashboard/[edit_token]/convidados`** — árvore de quem
  confirmou e quem convidou quem (`parent_rsvp_id`/`depth_level`, já
  existiam no schema, zero migração). Layout **vertical (cima→baixo)**, não
  indentação lateral — cada nó centralizado, filhos conectados por linha
  vertical abaixo do pai, estilo organograma. Cor do avatar por nível
  (`bg-blue-500`, `bg-pink-500`, `bg-orange-500`, `bg-purple-500`,
  `bg-teal-500`, cíclico). **Foto de perfil real** quando o telefone do
  RSVP bate com um `users.avatar_url` existente (lookup por telefone,
  fallback pra inicial colorida quando a pessoa ainda não tem conta/foto)
  — validado com a conta real do Luciano.
  - Card "Total" do painel ganhou o link "Ver quem vai" (só aparece com
    ≥1 confirmação), indo direto pra essa página. **Sem gate de créditos
    por enquanto** — decisão explícita do Luciano ("linka por enquanto,
    não estou liberando nada, vou fazer isso só qdo tiver tudo
    funcionando"). O paywall de 3 créditos (já combinado no modelo de
    créditos) fica pra quando o motor de créditos existir de verdade, e aí
    precisa cobrir tanto essa página quanto a lista "Confirmados" que já
    existe no painel (hoje as duas mostram nome ungated).
- **`/meus-convites` ganhou paginação**: 15 convites por página (grid 5×3
  no desktop), "‹ Anterior"/"Próxima ›" via `?page=N` (server-side,
  `.range()` no Supabase), redirect automático se a página pedida não
  existir mais.
- **Rodapé "subindo" corrigido em todas as páginas curtas** — mesmo padrão
  já usado na home (`min-h-screen flex flex-col` no container + `flex-1`
  no conteúdo, sem gap fixo) aplicado em `/meus-convites`, `/dashboard`,
  `/dashboard/.../convidados` e `/criar`. `InfoPageShell` já seguia o
  padrão. Cobertura completa: com pouco conteúdo o rodapé fica fixo no fim
  da viewport; quando o conteúdo cresce, rola normalmente.

### Como foi validado
Toda mudança que mexia com dados reais (árvore de convidados, paginação,
vínculo de foto) foi testada contra o **Supabase de produção com a conta
real do Luciano** (telefone `11964480411`) — inserindo RSVPs/eventos de
teste via script Node temporário (`.mjs` descartável, lendo `.env.local`),
tirando screenshot, e apagando os dados logo em seguida. Nenhum dado de
teste ficou para trás. `npm run build` limpo depois de cada mudança.

### Pendências conhecidas (status atualizado 2026-08-16 parte 3)
1. **`app/api/og/route.tsx`** — preview do link no WhatsApp ainda no
   gradiente escuro antigo. Resolver antes de divulgar link de verdade.
2. **`/login`, `/login/verificar`, `/perfil`** — únicas páginas que ainda
   não seguem o tema claro/padrão atual.
3. **Motor de créditos real** (saldo, Stripe, débito por ação) — ainda não
   implementado. Quando existir, precisa gatear "Ver quem vai" e a lista
   "Confirmados" do painel (ambas ungated hoje, de propósito).
4. **"Como funciona?" e "Fale conosco"** — páginas existem mas não estão
   linkadas em lugar nenhum; entram no menu de bolinhas quando esse
   popover for desenhado.
5. 10 imagens de header ainda são placeholder (Picsum) — Sandro entrega as
   definitivas depois.

---

## Sessão 2026-08-16 (parte 2) — DatePicker/TimePicker, header Google-style, /meus-convites

### Feito
- **`components/DatePicker.tsx` e `components/TimePicker.tsx`** (novos):
  substituem os campos `input type="date"/"time"` nativos no `/criar`.
  Motivo: bug do WebKit no Safari iOS que ignora `width:100%` nesses
  inputs e estoura a borda do card — **3 tentativas de CSS documentadas
  na sessão anterior falharam** (min-w-0, position:absolute,
  width:1px+min-width:100%). Solução definitiva: campos 100% próprios,
  sem depender de controle nativo do sistema. DatePicker = calendário
  custom (mês navegável, dia de hoje marcado, dia selecionado em laranja).
  TimePicker = lista de horários de 30 em 30 min com scroll.
- **`components/HeaderPopover.tsx` + `components/AppHeaderNav.tsx`**
  (novos) — **o padrão de header adotado para todas as páginas internas**,
  referência: `Vaikeuvou/Ref Google /google_desktop_menu.png`,
  `google_desktop_perfil.png`, `google_mobile_perfil.png`.
  - `HeaderPopover`: shell reutilizável — trigger circular, painel
    flutuante no desktop (canto superior direito, X pra fechar), tela
    cheia com degradê laranja no mobile.
  - `MenuPopover`: ícone de grade (⊞), lista de páginas com acesso.
  - `ProfilePopover`: avatar/iniciais, nome, "Créditos disponíveis: Em
    breve" (placeholder — motor de crédito ainda não existe), "Editar
    perfil", **"Sair"** (logout, movido pra cá — `LogoutButton.tsx`
    antigo foi deletado).
  - Header estrutural: desktop = logo » breadcrumb » título numa linha só,
    Menu+Perfil alinhados à direita. Mobile = logo + Menu/Perfil na
    primeira linha, breadcrumb+título na segunda.
  - Aplicado em `/criar`, na home (só quando logado) e em `/meus-convites`.
- **Ajuste fino do header** (feito ao vivo, várias iterações): ícones
  Menu/Perfil +10% só no desktop, logo e título -10% no mobile também,
  depois mais -2px no título. Estado final: título "Criar convite" 25px.
- **Sublinhado global no hover pra links de texto**: regra CSS
  `a:not([class*="bg-"]):hover { text-decoration: underline }` em
  `globals.css` — pula links estilizados como botão. No card do evento,
  ícones (📍🔗) tiveram que sair de dentro do `<a>` pra não ficarem
  sublinhados junto com o texto.
- **`/meus-convites`** (renomeado de `/meus-eventos` — ver abaixo) migrou
  pro tema claro: header padrão, botão "Criar novo convite" laranja
  (era violeta), cards claros. Container `max-w-lg` (512px, "esticado e
  colado" no relato do Luciano) → `max-w-5xl` com **grid responsivo**
  (1 col mobile, 2 sm, 3 lg) em vez de lista de coluna única.
- **Renomeação "Meus eventos" → "Meus convites"** (rota + textos), por
  coerência de terminologia. Regra: "convite" é o produto, "evento" só
  sobrevive onde é literalmente o nome da coisa sendo criada (label "Nome
  do evento" e o preview homônimo — únicas exceções intencionais).
  - Rota: `app/meus-eventos/` → `app/meus-convites/` (git mv).
  - Redirect permanente `/meus-eventos` → `/meus-convites` em
    `next.config.ts`, por segurança (link já compartilhado não quebra).
  - Middleware matcher atualizado.
  - Textos: "Editar evento"→"Editar convite", "Vídeo do evento"→"Vídeo do
    convite", "Erro ao criar evento."→"Erro ao criar convite.", "Evento
    criado com sucesso!"→"Convite criado com sucesso!", etc. — inclusive
    no painel do anfitrião (`dashboard`), mesmo esse ainda estando no tema
    escuro antigo (texto é independente do visual).

### Nota sobre testes visuais
Headless Chrome local (`--headless=new`) tem um bug reproduzível de
viewport em telas estreitas (~390px) — conteúdo renderiza como se o
container fosse ~2x mais largo, depois a screenshot corta no tamanho
nominal. **Confirmado com teste de controle** (HTML puro, sem
Tailwind/Next). Não confiar em screenshot mobile dessa ferramenta local —
desktop funciona normalmente. Luciano testa no celular real e manda print.

Também: clique programático (`.click()`/`dispatchEvent`) em botões dentro
de `HeaderPopover` não registrou de forma confiável nesse mesmo ambiente
headless, mesmo com sequência completa de eventos de mouse — mas
funcionou perfeitamente no dispositivo real do Luciano. Não é bug de
código, é limitação da ferramenta de teste local pra esse padrão
específico (popover com trigger circular). Não vale mais tempo tentando
reproduzir isso localmente.

### Pendências desta parte
- `EventoPreview` dentro do `/criar` ainda não tem logo tão grande quanto
  o card real (ficou proporcional à escala menor do preview, nunca foi
  pedido pra igualar 1:1).
- Sinais visuais de trava de crédito (quadradinho cadeado → mensagem →
  link "Almoço grátis") ainda não implementados — combinado que vêm
  depois do layout das páginas.

---

## Sessão 2026-08-16 — acabamento da página do evento + modelo de negócio

### Feito
- **Botão BORA vira imagem**: `letra_bora.png` + `icone_bora.png` (assets em
  `/public`, vieram de `Vaikeuvou/logos e botoes/`) substituem o texto "BORA
  🏃" nos botões CTA e "Confirmar BORA" — botão continua sendo `<button>` de
  CSS normal (fundo, hover, `w-full` responsivo), só o conteúdo interno
  virou duas imagens lado a lado. Aplicado no card real e no preview do
  `/criar`.
- **Local do evento vira link pro Google Maps** (URL de busca universal,
  não precisa de geocoding).
- **Degradê de marca no corpo do card**: branco → `#fcede1` (laranja bem
  diluído), substituindo o pastel-por-foto que variava por header
  escolhido — decisão consciente de simplificar pra identidade consistente
  em vez de variar por imagem. Fundo da página (atrás do card) continua
  usando o pastel-por-foto.
- **Ajustes finos do card**: borda 8px (acompanha o raio do ícone da
  marca), logo 250px, avatar 100px, texto ao lado do avatar centralizado
  na altura, "Vamo aí?" 23px, vídeo com a mesma borda do card.
- **Campos Data/Horário do `/criar` viraram texto com máscara própria**
  (`DD/MM/AAAA` e `HH:MM`, digitação livre, sem seletor nativo). Motivo:
  bug do WebKit em `input type="date"/"time"` no Safari iOS que ignora
  `width:100%` e estoura a borda do card — **3 tentativas de CSS falharam**
  (min-w-0, position:absolute, width:1px+min-width:100% — essa última
  chegou a regredir o desktop, ficou 1px). Trade-off aceito: perde o
  calendário/relógio nativo do sistema, ganha controle total de tamanho.
  Se quiser o seletor visual de volta no futuro, precisa construir um
  datepicker customizado (não nativo).
- Dois bugs de mobile corrigidos no caminho: breadcrumb quebrando texto no
  meio da palavra (`flex-wrap` + `whitespace-nowrap` + logo menor só no
  mobile, `h-8 md:h-[52px]`), e `overflow-x: hidden` global como rede de
  segurança contra estouro horizontal.

### Decisão de modelo de negócio (discutida, NADA implementado ainda)
Luciano quer **créditos pré-pagos** (pacotes 10/20/50/100), não assinatura
— combina melhor com uso esporádico de evento do que recorrência. Regra:
tudo editável de graça até a data do evento, **exceto**: 2ª mudança de data
(2 créditos), trocar imagem customizada (1 crédito/troca — imagem de
template continua grátis), trocar vídeo do YouTube (1 crédito), imagem
gerada por IA (3 créditos/troca), verificar nome de quem vai (3 créditos).
Duas dessas ações (IA e verificação de convidado) **ainda não existem como
feature**, não é só destravar paywall.

Combinado: **não** construir tudo liberado pra depois travar (gera
sensação de perda no usuário) — nascer já com o sinal visual da trava
(quadradinho cadeado → clica → mensagem "precisa de crédito" → link pra
página "Almoço grátis", que ainda não existe, vira a explicação do modelo).
Mas o **motor de crédito de verdade (saldo, Stripe, débito por ação)** fica
pra uma rodada própria — grande demais pra misturar com ajuste de layout.
Sequência combinada: primeiro terminar o layout das páginas que faltam
(dashboard, auth/perfil), DEPOIS os sinais de trava, DEPOIS o motor de
crédito.

---

## Identidade visual — sessão de hoje

Primeira aplicação real da marca entregue pelo Sandro (sócio, 50/50), a
partir de mockups em `/Users/lucianomaeda/Vaikeuvou/` (fora do repo — pasta
de referência, não versionada):
- `Home/Home_app.png` — mockup da home, medido pixel a pixel
- `logos e botoes/` — logo horizontal s/ slogan (`logo.png` no repo), logo
  vertical c/ slogan "Vamo aí?" (`logo-vertical.png`), botão BORA
- `pagina convite/estilo_convite.png` — referência do card do evento
- `Ref Google/` — benchmark de UX: Google Busca (home) e Google Forms
  (seletor de imagem de cabeçalho)

### Princípios de design fixados nesta sessão
- **Benchmark = Google Busca**: fundo branco, uma única ação clara, marca
  deslocada (não dead-center), rodapé fixado na base via flex (`flex-1` no
  conteúdo acima empurra o footer pra baixo, sem gap fixo que quebraria em
  telas de altura diferente).
- **"vaikeuvou" + título do evento formam uma frase** ("vai que eu vou **no
  jogo do Corinthians**") — por isso no card do convite o wordmark é grande,
  quase do tamanho do título, colado nele (não é uma assinatura pequena).
- **Rodapé com brincadeiras propositais**: "18 anos depois" (a marca nasceu
  há 18 anos, antes do WhatsApp existir, não vingou na época, ideia é
  atemporal) e "Almoço grátis" (não existe almoço grátis — o app é grátis,
  mas alguém banca; link explica planos premium). Quebra proposital do "não
  me faça pensar" — é zona de baixo tráfego, ninguém clica em política de
  privacidade mesmo, então dá pra ter graça ali sem custar conversão.
- **Fonte: Arial/Helvetica em tudo** (Oswald foi testada e revertida — não
  ficou bom, decisão tomada e fechada).
- **Seletor de imagem de cabeçalho = Google Forms, sem customização de
  fonte**: grid de presets, escolher um auto-deriva um tom pastel de fundo
  pro corpo do card. Free = só presets. Pago = também upload próprio.

### O que foi feito
- **Home (`app/page.tsx`)**: reescrita completa. Logo vertical (220px
  mobile / 250px desktop), texto 14.7px/16.7px, botão "CRIAR CONVITE"
  (padding reduzido ~10%), rodapé com os 5 links incluindo "18 anos
  depois"/"Almoço grátis".
- **Card do convite (`app/e/[slug]/EventoClient.tsx`)**: migrou de gradiente
  escuro por hash de título pro padrão banner-foto + corpo claro. Logo
  horizontal 298px de largura, colado no título (mb-4). Fundo pastel também
  derivado da imagem do header.
- **`/criar` (`app/criar/CriarClient.tsx`)**: tema claro completo. Breadcrumb
  numa linha só — logo (clicável → home) » Meus eventos » Criar convite
  (ativo). Renomeado de "Criar evento" pra "Criar convite" em todo lugar
  (H1, botão, sem emoji). Preview do formulário agora espelha o card real
  (mesmo header-photo + pastel bg + logo).
- **`lib/headers.ts`** (novo): 10 presets de imagem de cabeçalho — hoje são
  placeholder do Picsum (banco de imagem gratuito), Sandro vai entregar as
  definitivas depois. Trocar só o `src` de cada item, mantendo os `id`.
  Seleção automática determinística por título (`titleToHeader`), mesma
  lógica que já existia pro gradiente antigo.
- **API**: `bg_image_url` agora é aceito em `POST /api/eventos` (criação) e
  `PATCH /api/eventos/editar` (edição) — coluna já existia no schema, só não
  estava sendo gravada.
- **`public/logo.png`**: atualizado pro arquivo sem padding que o Sandro/
  Luciano corrigiu no meio da sessão (480x108, era 548x188 com espaço em
  branco ao redor do ícone). width/height do next/image corrigidos nos 3
  lugares que usam esse arquivo — sem isso a imagem distorce.

### Pendências conhecidas (status atualizado 2026-08-16 parte 2)
1. **`app/api/og/route.tsx`** — a imagem que aparece como preview do link no
   WhatsApp (antes de clicar) ainda usa o gradiente escuro antigo
   (`lib/gradient.ts`). Card real já mudou, essa não — fica destoante.
   **Ainda pendente.**
2. **`/dashboard/[edit_token]`** — painel do anfitrião, tema escuro antigo,
   layout **ainda não convertido** (só os textos "evento→convite" foram
   corrigidos nesta parte, o visual continua o de antes).
3. **`/login`, `/login/verificar`, `/perfil`** — fluxo de auth/perfil,
   ainda tema escuro antigo, não tocado. **`/meus-eventos` saiu desta
   lista** — foi convertido e renomeado para `/meus-convites` nesta parte.
4. **10 imagens de header são placeholder** — Sandro vai entregar as
   definitivas, aí é só trocar em `lib/headers.ts`.
5. **`lib/gradient.ts`** não foi removido — ainda usado por
   `app/api/og/route.tsx` (pendência 1 acima).

**Why:** sessão longa de ajuste fino de identidade visual, com muita
iteração em px/% (logo, fonte, espaçamento) — decisões pequenas mas muitas,
vale ter registrado pra não perder o fio ao retomar.
**How to apply:** ao retomar, próximas na fila são `/dashboard` (converter
layout, já com texto certo) e depois `/perfil`+`/login`+`/login/verificar`.
Resolver a pendência 1 (OG image) antes de divulgar links no WhatsApp de
verdade — hoje o preview do link não bate com a página real.
