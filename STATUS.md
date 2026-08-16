# vaikeuvou.app — Status

Última atualização: 2026-08-16

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

### Pendências conhecidas (não tocadas nesta sessão)
1. **`app/api/og/route.tsx`** — a imagem que aparece como preview do link no
   WhatsApp (antes de clicar) ainda usa o gradiente escuro antigo
   (`lib/gradient.ts`). Card real já mudou, essa não — fica destoante.
2. **`/dashboard/[edit_token]`** — painel do anfitrião, ainda tema escuro
   antigo, não tocado.
3. **`/login`, `/login/verificar`, `/perfil`, `/meus-eventos`** — fluxo de
   auth/perfil, ainda tema escuro antigo, não tocado.
4. **10 imagens de header são placeholder** — Sandro vai entregar as
   definitivas, aí é só trocar em `lib/headers.ts`.
5. **`lib/gradient.ts`** não foi removido — ainda usado por
   `app/api/og/route.tsx` (pendência 1 acima).

**Why:** sessão longa de ajuste fino de identidade visual, com muita
iteração em px/% (logo, fonte, espaçamento) — decisões pequenas mas muitas,
vale ter registrado pra não perder o fio ao retomar.
**How to apply:** ao retomar, resolver a pendência 1 (OG image) antes de
divulgar links no WhatsApp de verdade — hoje o preview do link não bate com
a página real. Pendências 2-3 são as próximas telas na fila, mesma ordem
sugerida no fim da sessão anterior (dashboard → auth/perfil).
