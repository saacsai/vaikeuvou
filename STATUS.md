# vaikeuvou.app — Status

Última atualização: 2026-08-16 (parte 2)

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
