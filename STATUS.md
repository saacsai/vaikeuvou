# vaikeuvou.app — Status

Última atualização: 2026-08-17

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
