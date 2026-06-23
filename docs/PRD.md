# PRD — Guia de Streaming

**Versão:** 2.1
**Autor:** Caio Planinschek (PO)
**Data:** 23/06/2026
**Audiência:** time do projeto Guia de Streaming (devs back, devs front, QA)
**Status:** ativo
**Supersede:** v2.0 (30/05/2026). Mudanças desta versão (redesign da Home): **tema escuro como padrão** (US-5.1 / §5.1 / §15), **estado inicial "Em alta"** na home via discover sem gênero (US-2.3 / §12 / §15), **marca pública "Plot Twist"** (§1) e **descrição da Home atualizada** (§7.1 / §12). Histórico: a v2.0 migrou a auth para BFF e recomprimiu o cronograma para 02/07 (supersedeu a v1.1 de 26/05).

---

## 0. Como ler este PRD

> Esta seção existe para que **qualquer integrante** consiga navegar o documento, derivar tarefas e implementar sem reinterpretar o produto do zero. Leia-a antes de tudo.

### 0.1 Ordem de leitura

1. **Este PRD** — o quê e o porquê do produto inteiro.
2. **`CONTEXT.md` (glossário canônico)** — vocabulário fechado do projeto. Em conflito de termo, o glossário vence.
3. **Plano da sprint** (`sprint-N-plan.md`) — o recorte operacional do bloco atual.
4. **Issue** — a unidade de trabalho. Cada issue referencia `PRD §X`.

### 0.2 Âncoras estáveis

Os números de seção (`§1`…`§17`) são **estáveis**: issues e specs citam `PRD §6`, `PRD §8` etc. e esses ponteiros não mudam entre versões. Conteúdo é atualizado **in-place**; seções novas entram como `§0` (topo) ou no fim, nunca renumerando o miolo.

### 0.3 Legendas

**Prioridade** (ver §5.1):
- **P0** — núcleo inegociável. Tem que estar de pé para a **demo + nota** de 02/07. Se um P0 está em risco, é o time inteiro que para para destravá-lo.
- **P1** — MVP comprometido, mas é a **primeira linha de corte** se o tempo apertar. Está no plano; não é promessa de sangue.
- **stretch (§5.3)** — só se sobrar tempo. **Nunca** foi prometido; cortar um stretch não é falha.

**Status:** ✅ feito · ⏳ pendente · ❓ incerto / a confirmar.

### 0.4 Terminologia

Use os termos canônicos do `CONTEXT.md`: **título** (filme ou série), **avaliação** (nota inteira 1-10), **visto**, **favorito**, **onde assistir / provedor**, **ficha do título**, e os de auth — **BFF**, **sessão** (cookie `session`), **Bearer interno**, **chave interna (`X-Internal-Key`)**. Não introduza sinônimos (`mídia`, `conteúdo`, `token no localStorage`, `gateway` etc.).

### 0.5 Para quem implementa

- **Critério de aceite vira checklist de issue** — cada `- [ ]` nos épicos (§6) é uma asserção verificável.
- **Mudança cirúrgica:** toque só no que a tarefa exige; preserve estilo e decisões existentes; sinalize problemas fora do escopo em vez de resolvê-los no mesmo PR.
- **Auth segue a spec BFF** — não invente fluxo de cookie/token; o desenho está fechado em §8.

---

## 1. Resumo executivo

O **Guia de Streaming** é um webapp para usuários brasileiros descobrirem **em qual catálogo de streaming** um filme ou série está disponível, consolidando busca, ficha completa e provedores em uma única interface, sem precisar consultar JustWatch, IMDb e o app de cada streaming separadamente. O MVP cobre cadastro, busca, ficha de filme/série, indicação de "onde assistir" via TMDB API (região BR), avaliação 1-10, marcação de "visto", favoritos, perfil e tema claro/escuro.

> **Nome do produto × marca:** "Guia de Streaming" é o nome do projeto (acadêmico/interno); **"Plot Twist"** é o nome público da marca, exibido na interface — no hero da home e no título das abas (metadata). Os dois se referem ao mesmo produto.

A aplicação é construída sobre uma arquitetura **BFF (Backend-for-Frontend)**: o navegador fala **só** com o Next.js (same-origin), que fala com a API Nest.js **server-to-server**. A entrega final é **02/07/2026** — restam **~4,5 semanas** a partir do início desta versão (30/05), com um time de **13 integrantes** de disponibilidade variável. O escopo é deliberadamente enxuto e priorizado (§5.1) para caber nesse prazo.

---

## 2. Contexto e problema

### 2.1 Problema

Usuários de múltiplos serviços de streaming (Netflix, Prime Video, Disney+, HBO Max, Globoplay, Apple TV+) gastam tempo procurando manualmente em cada app onde um título específico está disponível. Sites como JustWatch resolvem isso parcialmente, mas a informação fica enterrada em widgets pequenos no IMDb ou em listas pouco objetivas.

### 2.2 Público-alvo

Brasileiros entre 18-45 anos que assinam dois ou mais serviços de streaming e consomem regularmente filmes e séries.

### 2.3 Por que agora (contexto acadêmico)

O projeto é a entrega da disciplina Laboratório de Desenvolvimento de Software (UVA 2026.1), com **entrega final em 02/07/2026**. Combina prática real de produto (PO, levantamento, backlog) com construção de aplicação web full-stack que integra API externa pública (TMDB).

---

## 3. Objetivos

### 3.1 Objetivos do produto

- Permitir que um usuário não-logado encontre rapidamente onde assistir um título específico.
- Permitir que um usuário logado mantenha um histórico pessoal de filmes/séries vistos, avaliados e favoritados.
- Construir uma experiência limpa em desktop, com responsivo básico para tablets e celulares.

### 3.2 Objetivos pedagógicos

- Praticar desenvolvimento full-stack com Next.js + Nest.js, integrados via **BFF**.
- Exercitar modelagem relacional com Prisma + PostgreSQL.
- Integrar API externa (TMDB) com tratamento de erro e cache.
- Trabalhar em time grande com cerimônias ágeis enxutas, organizando via GitHub Projects/Issues.

### 3.3 Critérios de sucesso observáveis

- [ ] Usuário não-logado consegue buscar "Oppenheimer" e ver os streamings BR onde assistir, em menos de 2 cliques a partir da home.
- [ ] Usuário logado consegue avaliar um filme com nota 1-10; sistema marca automaticamente como "visto".
- [ ] Apresentação final demonstra o fluxo completo **no ambiente publicado online** (Vercel + Azure VM) sem crash.
- [ ] Repositórios entregues com README executável por terceiro (instalável do zero).
- [ ] Documentação acadêmica entregue no template UVA, com DER, diagrama de arquitetura, telas e backlog.

---

## 4. Personas

### 4.1 Persona — Usuário casual

- **Quem:** assina 2-3 streamings, vê 1-2 filmes por semana.
- **Dor principal:** "vi um trailer no Instagram, quero assistir agora, em qual streaming está?".
- **Espera do site:** busca rápida, resposta visual clara dos streamings disponíveis.
- **NÃO espera:** rede social, debate, recomendações sofisticadas.

### 4.2 Persona — Cinéfilo

- **Quem:** consome 5+ filmes/séries por semana, gosta de manter histórico.
- **Dor principal:** falta um lugar próprio para registrar o que já viu e como avaliou, sem virar Letterboxd.
- **Espera do site:** ficha rica do filme + histórico pessoal de visto/avaliado/favoritos.
- **NÃO espera:** comentários, seguir outros usuários, feed social.

---

## 5. Escopo do MVP

### 5.1 Dentro do escopo — com tiering de prioridade

> O MVP é dividido em **P0** (núcleo inegociável para 02/07) e **P1** (comprometido, mas primeira linha de corte sob risco de prazo). Ver legenda em §0.3. A divisão dá ao time uma **linha de corte explícita**: sob pressão, protege-se o P0 e sacrifica-se P1 antes de tocar em qualidade ou prazo.

**P0 — núcleo demonstrável (tem que ir):**

- Cadastro e login (email + senha; hash bcrypt/argon2), **via BFF** (sessão por cookie `session` HttpOnly setado pelo Next — ver §8).
- Busca de filmes **e séries** (TMDB API, região BR).
- Ficha do título: sinopse, poster, elenco, duração/temporadas, nota TMDB, provedores BR.
- Indicação "onde assistir" com destaque visual (área dedicada na ficha).
- **Avaliação 1-10** (usuário logado; marca como visto automaticamente) — é critério de sucesso §3.3.
- **Deploy online** (Vercel + Azure VM) — exigência do Prof. Paulo Andrade.
- Documentação acadêmica + README executável.

**P1 — comprometido, corta primeiro se faltar tempo:**

- Marcação manual de "visto" e de "favorito".
- Perfil do usuário: nome, data de criação, totais (vistos / avaliados / favoritos) e listas simples dos 30 itens mais recentes de cada uma.
- Home com destaques e filtros por gênero (single-select), com estado inicial **"Em alta"** (populares).
- Dark mode (padrão) e light mode.
- Responsividade básica em desktop (foco principal) → tablets/celulares.

### 5.2 Fora do escopo

Registrado para não voltar atrás sem decisão explícita:

- Rede social: seguir usuários, feed de atividade, ver lista de visto de outros.
- Comentários em filmes.
- CRUD próprio de filmes/séries (consumimos só TMDB, sem catálogo proprietário).
- Painel administrativo e moderação (sem RBAC, sem tela admin; se necessário, exclusão pelo banco direto).
- Link direto que abre o app do streaming.
- PWA / instalação no mobile.
- Recomendação algorítmica.
- Confirmação de email no cadastro (sem infra de envio de email no MVP — ver §5.3).
- "Esqueci minha senha" / reset de senha por email (depende de confirmação de email; ambos para §5.3).
- Edição de perfil (mudar nome/email/senha) e deleção de conta pelo próprio usuário (alteração via banco direto se necessário).

### 5.3 Pode entrar se sobrar tempo (stretch)

- Lista **"Quero ver"** (watchlist separada de favoritos — usuário pode ter o mesmo título em ambas; sem migration dos favoritos existentes quando entrar).
- Filtros avançados na busca (década, país, gênero combinado).
- Exibição da nota IMDb (se TMDB expuser).
- Trailer embedado na ficha.
- **Nota agregada do Guia de Streaming** na ficha — média das avaliações dos usuários do nosso app, exibida apenas se houver pelo menos N avaliações (N a definir; sugestão inicial: 5). Distinta de **Nota TMDB** e de **Minha nota**.
- **Filtros, ordenação selecionável e paginação nas listas do perfil** — MVP traz só os 30 mais recentes por data.
- **Filtro por gênero dentro de resultados de busca por texto** e **multi-select de gêneros** — MVP traz só single-select na home.
- **Refresh token automático** — MVP usa JWT de 24h sem renovação; stretch adiciona refresh token com rotação. **(Nota: implementação prematura de refresh chegou no PR #21 — fica desligada/removida até virar stretch, ver §15.)**
- **Confirmação de email + recuperação de senha** — pacote acoplado, depende de integrar serviço de envio de email (Resend / SendGrid free / equivalente).
- **Blocklist de tokens no logout (logout server-side)** — MVP faz logout no BFF apagando o cookie `session` no Next, mas **não rastreia tokens revogados**; o JWT segue tecnicamente válido até expirar em 24h. Stretch adiciona a tabela de revogados consultada por guard no Nest.
- **CSRF token** — MVP aceita o risco com `SameSite=Lax`; stretch adiciona token anti-CSRF.

---

## 6. Funcionalidades — épicos e user stories

> Cada US tem critérios de aceite (checklist) + uma linha **DoD** (Definition of Done — o sinal observável de "pronto"). Prioridade e sprint de cada US estão na matriz de rastreabilidade (§13.1).

### Épico E1 — Autenticação (BFF)

- **US-1.1** Como visitante, quero criar uma conta com email e senha para acessar funcionalidades logadas.
  - [ ] Validação básica de email via regex (presença de `@` e ponto depois) — sem chamada externa, sem MX lookup.
  - [ ] Senha mínima 8 caracteres, **sem exigir** complexidade obrigatória (letra/número/símbolo) — alinha com NIST SP 800-63B.
  - [ ] Hash da senha no banco com bcrypt ou argon2 (nunca em texto plano, nunca hash simples como MD5/SHA1).
  - [ ] Email é único no banco (`@unique` no Prisma).
  - [ ] **Nome:** trim automático; mínimo 3 caracteres após trim; máximo 50; aceita letras (com acento), números, espaços, hífen e apóstrofe; **não exige unicidade**.
  - [ ] Cadastro **não** faz auto-login (cria conta → vai para a tela de login). **Sem cookie** no cadastro.
  - **DoD:** `POST /api/auth/register` cria o usuário com hash; email duplicado retorna 409; nenhum cookie é setado.

- **US-1.2** Como usuário, quero fazer login para acessar minha conta.
  - [ ] **Sessão via cookie `session` HttpOnly first-party no Next** (setado pelo BFF). O JWT trafega como **Bearer só no canal interno** Next→Nest; o JS do browser nunca lê o token (ver §8).
  - [ ] Token (JWT) com expiração de **24h**; cookie com `Max-Age=86400` casado.
  - [ ] Ao expirar, a próxima requisição protegida (via `/api/auth/me`) retorna 401 e o front redireciona para a tela de login.
  - [ ] **Rate limit** no login: máximo 5 tentativas a cada 15 minutos por IP (`@nestjs/throttler` no Nest, lendo `X-Client-IP` repassado pelo Next); excedido retorna 429.
  - **DoD:** `POST /api/auth/login` com credenciais válidas responde `200 {user}` e seta `Set-Cookie: session=…`; F5 mantém a sessão via `/api/auth/me`; 6ª tentativa em 15min retorna 429.

- **US-1.3** Como usuário, quero fazer logout.
  - [ ] Logout é **100% no BFF**: o front chama `POST /api/auth/logout`; o **Next apaga o cookie `session`** (`Max-Age=0`). Sem endpoint no Nest, sem chamada server-to-server.
  - [ ] **Sem blocklist no back** — o token segue tecnicamente válido até expirar em 24h (blocklist é stretch §5.3). Ganho do BFF: depois do logout o browser não tem mais como apresentar o token, pois ele só vivia no cookie HttpOnly que o Next acabou de apagar.
  - **DoD:** clicar "Sair" chama `POST /api/auth/logout`, o cookie some, e uma chamada subsequente a `/api/auth/me` retorna 401.

### Épico E2 — Catálogo (busca e ficha)

- **US-2.1** Como visitante ou logado, quero buscar por filme ou série pelo nome.
  - [ ] A busca passa pelo BFF: o browser chama `GET /api/titles/search` (same-origin); o Next faz proxy para `GET /titles/search` no Nest. A TMDB key nunca vai ao browser.
  - [ ] Tempo de resposta dentro do orçamento de §8 (200ms cache-hit / 2s cache-miss).
  - [ ] **Filmes e séries vêm juntos** em uma única lista (back usa `/search/multi`, filtra fora resultados de pessoa).
  - [ ] Cards mostram poster + título + ano + **badge visual indicando filme ou série**.
  - [ ] Paginação via **botão "Carregar mais" no rodapé** (20 resultados por página da TMDB; cada clique acumula mais 20).
  - [ ] Quando não há mais páginas, esconder o botão.
  - [ ] **Estado "0 resultados":** ícone discreto + texto "Nenhum resultado para '<query>'. Tente outro termo.".
  - **DoD:** buscar "Oppenheimer" retorna cards com badge correto; "Carregar mais" acumula; estado 0-resultados aparece para query sem match.

- **US-2.2** Como visitante ou logado, quero ver a ficha completa de um título.
  - [ ] Sinopse, poster, elenco principal, duração/temporadas, nota TMDB.
  - [ ] Tags de gênero.
  - [ ] Dados vêm do Nest (proxy do Next quando a chamada for browser-facing); TMDB sempre via back.
  - **DoD:** abrir um título da busca renderiza a ficha completa com a área de "onde assistir" (US-3.1) embutida.

- **US-2.3** Como visitante ou logado, quero descobrir títulos navegando por gênero a partir da home.
  - [ ] Chips horizontais clicáveis na home (abaixo do hero e da busca): "Em alta | Ação | Comédia | Drama | Terror | ..." (a lista de gêneros vem da TMDB via `/genre/movie/list` + `/genre/tv/list` em PT-BR, com cache permanente no back).
  - [ ] **Single-select**: um gênero ativo por vez; clicar no chip ativo de novo volta para **"Em alta"**.
  - [ ] **Estado inicial "Em alta":** sem nenhum gênero selecionado, a home exibe uma grade de títulos populares via discover **sem gênero** (`GET /api/titles/discover?page=N`, sem `genre`); o back retorna os populares do momento (ISSUE-BACK-30).
  - [ ] Quando um gênero é selecionado, exibir destaques daquele gênero via discover **com gênero** (TMDB `/discover/movie?with_genres=X` e equivalente `/discover/tv`).
  - [ ] Filtro **não** atua dentro de resultados de busca por texto no MVP (vai para §5.3).
  - **DoD:** a home abre em "Em alta" (populares); selecionar "Ação" troca os destaques para títulos de ação; clicar de novo volta para "Em alta".

### Épico E3 — Onde assistir

- **US-3.1** Como visitante ou logado, quero ver em qual streaming brasileiro o título está disponível.
  - [ ] Área visualmente destacada na ficha (definida no design).
  - [ ] Logos dos provedores listados.
  - [ ] Categorias TMDB: flatrate (assinatura), rent (aluguel), buy (compra) — exibir pelo menos flatrate.
  - [ ] **Estado "sem provedor BR":** quando a TMDB não retorna provedores para `region=BR`, exibir "Este título não está disponível em provedores de streaming no Brasil." dentro da área de "Onde assistir"; o resto da ficha continua normalmente.
  - **DoD:** ficha de um título com provedor BR mostra os logos por categoria; ficha de título sem provedor BR mostra o estado vazio sem quebrar o resto.

### Épico E4 — Histórico do usuário

- **US-4.1** Como logado, quero avaliar um filme/série com nota de 1 a 10, podendo trocar ou remover a avaliação depois.
  - [ ] Sistema marca automaticamente como "visto" ao receber avaliação (`Watched.origem = "auto"`).
  - [ ] Não permite desmarcar "visto" enquanto houver avaliação registrada.
  - [ ] Trocar a nota **atualiza** a avaliação existente, sem criar registro duplicado e sem confirmação extra.
  - [ ] Remover a avaliação é permitido; se o "visto" foi marcado pela própria avaliação (`origem = "auto"`), o "visto" cai junto; se foi marcado manualmente antes (`origem = "manual"`), o "visto" permanece.
  - **DoD:** avaliar com nota 8 persiste a avaliação e marca visto-auto; trocar para 6 atualiza sem duplicar; remover a avaliação derruba o visto-auto e preserva o visto-manual.

- **US-4.2** Como logado, quero marcar título como visto sem precisar avaliar (`Watched.origem = "manual"`).
  - **DoD:** marcar visto manual num título sem avaliação registra `Watched.origem = "manual"`.

- **US-4.3** Como logado, quero favoritar título.
  - **DoD:** favoritar/desfavoritar alterna o `Favorite`, independente de visto e avaliação.

- **US-4.4** Como logado, quero ver meu perfil com totais **e listas simples** (vistos / avaliados / favoritos).
  - [ ] Três contadores no topo: vistos, avaliados, favoritos.
  - [ ] Três listas correspondentes, cada uma com **poster + título + ano** de cada item.
  - [ ] Ordenação: mais recente primeiro (por `Watched.watchedAt`, `Rating.createdAt`, `Favorite.createdAt`).
  - [ ] Limite de 30 itens mais recentes por lista — sem paginação no MVP.
  - [ ] Sem filtros internos no MVP (filtros, ordenação selecionável e paginação vão para §5.3).
  - [ ] Na lista de avaliados, exibir também a nota dada pelo usuário.
  - **DoD:** perfil mostra os 3 totais corretos e as 3 listas (30 mais recentes), com a nota nos avaliados.

### Épico E5 — Tema e UI

- **US-5.1** Como usuário, quero alternar entre dark e light mode.
  - [ ] **Default na primeira visita: tema escuro (dark).** A identidade da marca (Plot Twist) é cinematográfica/escura, então o tema escuro é o padrão — não o `prefers-color-scheme` do sistema.
  - [ ] Toggle (ícone sol/lua) sempre visível no header global, canto direito.
  - [ ] Preferência persistida no navegador (localStorage) — uma vez tocado, a escolha do usuário sobrescreve o default.
  - **DoD:** o toggle alterna o tema, persiste após F5; a primeira visita abre em dark.

- **US-5.2** Como usuário, quero usar o site com layout responsivo básico em desktop.
  - **DoD:** as telas principais (home, busca, ficha, perfil) não quebram em larguras de tablet/celular via breakpoints CSS.

---

## 7. Fluxos principais

### 7.1 Onboarding → primeira busca

Visitante chega na home → vê o hero da marca (Plot Twist) + barra de busca + chips de gênero com a grade **"Em alta"** (populares) → pode pesquisar sem login (`/api/titles/search` same-origin) ou navegar pelos destaques → clica em título → vê ficha → vê "onde assistir" → se quer avaliar/favoritar, é levado para o cadastro/login → após login, volta para a ficha.

### 7.2 Avaliação que marca como visto

Usuário logado abre ficha → clica em avaliar → escolhe nota 1-10 → confirma → sistema persiste avaliação + marca `Watched` automaticamente → ficha atualiza estado visual.

### 7.3 Busca → "onde assistir" (dois hops do BFF)

Usuário (qualquer) digita query → browser chama `GET /api/titles/search` no **Next** (same-origin) → Next faz proxy para `GET /titles/search` no **Nest** (com `X-Internal-Key`) → Nest chama TMDB `/search/multi` → retorna lista → usuário clica → Nest chama TMDB `/movie/{id}` ou `/tv/{id}` + `/watch/providers` com `region=BR` → frontend renderiza ficha com área destacada de provedores. **A TMDB key vive só no Nest; o browser nunca a vê.**

---

## 8. Requisitos não-funcionais

- **Desempenho:**
  - **Cache-hit** (chamada TMDB já cacheada): resposta em até **200ms**.
  - **Cache-miss** (chamando TMDB pela primeira vez): resposta em até **2s**.
- **Cache TMDB:** via `@nestjs/cache-manager` em memória do processo Nest (sem Redis no MVP). TTLs diferenciados por endpoint:
  - Lista de gêneros (`/genre/movie/list`, `/genre/tv/list`): **permanente até restart do processo**.
  - Ficha do título (`/movie/{id}`, `/tv/{id}`): **24h**.
  - Provedores (`/movie/{id}/watch/providers`, equivalente tv): **12h**.
  - Busca (`/search/multi`): **1h**.

### 8.1 Arquitetura de autenticação (BFF)

> Desenho fechado em 30/05/2026.

O browser fala **só** com o Next (same-origin). O Next fala com o Nest **server-to-server** e é a **única** origem que acessa o Nest, que fica **fechado** pela chave interna. Toda chamada browser-facing — **auth + busca** — passa por route handlers `/api/*` do Next.

```
[Browser] ──same-origin──> [Next.js / BFF (Vercel)] ──server-to-server──> [Nest API (Azure VM)] ──> [TMDB]
   │  cookie `session` HttpOnly        │  X-Internal-Key (secret) +           │  Postgres
   │  (JS não lê o token)              │  Authorization: Bearer (só protegidas) +
   └─ nunca toca o Nest direto         │  X-Client-IP (IP real p/ rate-limit)
```

- **JWT** (`@nestjs/jwt` + `passport-jwt`) com expiração de **24h**; secret de assinatura vive **só no Nest**, nunca compartilhado com o Next; em `.env`, nunca commitada.
- **Sessão no browser = cookie `session`** (`HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`), first-party no domínio do Next, contendo o JWT. O JS do browser não lê o token; **sem `localStorage`, sem Bearer saindo do browser**.
- **Chave interna `X-Internal-Key`** (env `INTERNAL_API_KEY`): o Next injeta em **toda** chamada ao Nest; um **guard global** no Nest valida (roda **antes** do throttler). Fecha o back contra acesso direto e torna confiável o `X-Client-IP`. Exceção: `/health` (se existir, para o uptime check) fica fora do guard.
- **Dois guards no Nest:** (1) secret global em todas as rotas; (2) JWT (Bearer) só nas protegidas — por ora `/auth/me`; na fase de histórico, avaliar/favoritar.
- **Rehidratação após F5:** `GET /api/auth/me` (Next) → proxy `GET /auth/me` (Nest, guard Bearer) → `{user}`.
- **Rate-limit:** **no Nest** (VM 24/7 single-instance), com `getTracker` custom lendo **`X-Client-IP`** (confiável porque o secret garante a origem). 5 tentativas / 15 min por IP no login.
- **Logout:** 100% no BFF (Next apaga o cookie; sem endpoint no Nest; sem blocklist — stretch §5.3).
- **Sem refresh token no MVP** (stretch §5.3).

**Contrato — browser ↔ Next ↔ Nest (dois hops):**

| Endpoint | Browser → Next (`/api/*`) | Next → Nest |
|---|---|---|
| **register** | `POST /api/auth/register {name,email,password}` → `201 {id,name,email}` \| 400 \| 409. **Sem cookie.** | `POST /auth/register` (+secret) → `201 {id,name,email}` |
| **login** | `POST /api/auth/login {email,password}` → `200 {user}` **+ `Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`** \| 401 \| 429 | `POST /auth/login` (+secret, +`X-Client-IP`) → `200 {access_token,user}` **no corpo, sem cookie** \| 401 \| 429 |
| **logout** | `POST /api/auth/logout` → `204` **+ `Set-Cookie: session=; …; Max-Age=0`**. Sem chamada ao Nest. | — |
| **me** | `GET /api/auth/me` (cookie automático) → `200 {user}` \| 401 | `GET /auth/me` (+secret, +`Authorization: Bearer <jwt-do-cookie>`) → `200 {user}` \| 401 |
| **search** | `GET /api/titles/search?q&page` → `200 {results,page,totalPages,hasMore}` \| 400 \| 502 | `GET /titles/search?q&page` (+secret) → mesmo payload |

### 8.2 Segurança

- Hash de senha com **bcrypt** ou **argon2** (nunca texto plano nem hash simples).
- Validação de input em todos os endpoints (`class-validator` via Nest DTOs).
- **XSS-exfil mitigado** pelo `HttpOnly` (o token não é legível pelo JS). `HttpOnly` não imuniza XSS por completo — sanitização + **CSP/Helmet no Next** cobrem o resto.
- **Back fechado** pela chave interna `X-Internal-Key` → protege a cota TMDB (abuso de busca), criação de conta em massa e varredura.
- **Helmet** entra, com a ressalva: os headers/CSP que protegem o **browser** vão **no Next**, não só no Nest.
- **CSRF:** risco aceito no MVP com `SameSite=Lax`; CSRF token é stretch §5.3.
- **HTTPS obrigatório em produção em ambos os lados** — Vercel cobre o front automaticamente; o back resolve via Caddy/Traefik no `docker-compose` (Let's Encrypt automático com domínio próprio) ou Cloudflare grátis em modo proxy na frente da VM. Sem HTTPS no back, o front na Vercel é bloqueado por mixed content.
- **Ownership por `userId`:** queries de histórico (avaliar/visto/favoritar) sempre derivam o `userId` do JWT — não confiar em id vindo do cliente. (Sem RBAC/papéis — admin fora do MVP.)

### 8.3 Demais RNF

- **Deploy:** aplicação **deve estar acessível online** (exigência do Prof. Paulo Andrade). Stack:
  - **Front (Next.js / BFF): Vercel** — integração nativa, deploy automático via GitHub. As envs `API_INTERNAL_URL` e `INTERNAL_API_KEY` ficam **server-side** no Vercel (nunca `NEXT_PUBLIC_*`).
  - **Back (Nest.js): Azure VM 24/7 com Docker compose** — container do app NestJS na porta 3000 mapeada pra 80 da VM.
  - **Banco (PostgreSQL):** container Postgres no mesmo `docker-compose.yml` da VM, rede interna do Docker, sem exposição pública.
  - **IaC:** Bicep (Azure ARM). **CI/CD:** GitHub Actions, pipeline estrita à `main`.
  - **Três segredos** do projeto: **TMDB API key**, **JWT secret** e **chave interna (`INTERNAL_API_KEY`)** — em GitHub Secrets / ambiente da VM / Vercel server-side; nunca commitados.
- **Processo de deploy:** PRs que tocam IaC (Bicep), `docker-compose.yml` ou pipeline CI/CD exigem aprovação de pelo menos 2 integrantes antes de merge em `main`. Doc do deploy passo-a-passo mora no `README.md` do back.
- **Responsividade:** foco desktop, responsivo básico via breakpoints CSS para tablets/celulares.
- **Acessibilidade:** contraste mínimo WCAG AA em ambos os temas (dark/light).
- **i18n:** UI em PT-BR; sem multilíngue.
- **Logging:** `nestjs-pino`. Setup mínimo: `LoggerModule.forRoot()` no `AppModule` com defaults; sem `pino-pretty` em produção; em dev `pino-pretty` opcional. Campos por log: `level`, `time`, `context` (`auth`/`tmdb`/`db`), `msg`, `userId` quando aplicável, `err.stack` quando aplicável. **Nunca logar:** senhas (mesmo erradas), tokens JWT, body de request de login/cadastro — regra dura, checada visualmente no PR. **Onde logar (mínimo):** erros 5xx da TMDB; tentativas de login com senha errada e rate limit atingido; erros não-tratados via exception filter global. **Sem Sentry / Datadog / log aggregation pago no MVP.**
- **Tratamento de erros na UI:**
  - **Falha de rede / erro 5xx / timeout TMDB:** front mostra "Não foi possível carregar agora. Tente novamente." + botão "Tentar de novo". Detalhes técnicos só nos logs.
  - **404 / título não encontrado:** página "Título não encontrado" com link "Voltar para a home" (ver §12).
  - **Acesso fora do BR:** o app envia `region=BR` para a TMDB independente de onde o usuário está; sem detecção de geolocalização, sem warning, sem bloqueio.
- **Testes:**
  - **Back (Jest 30):** sem percentual de cobertura forçado. **Cenários obrigatórios:**
    - `auth.service`: cadastro com sucesso; cadastro com email duplicado (409 ou erro de validação); login com sucesso (retorna JWT válido **`{access_token,user}` no corpo**); login com senha errada (401); login com email inexistente (401, sem revelar que o email não existe); rate limit dispara após 5 tentativas em 15min (429, com tracker `X-Client-IP`). **+ `/auth/me`** retorna `{user}` com Bearer válido e 401 sem.
    - `titles.service` (TMDB integration): search com sucesso (lista com poster/título/ano/badge); cache hit não chama TMDB de novo (mock zera chamadas na 2ª requisição); erro de rede da TMDB retorna 5xx tratado sem crash do back.
  - **Front:** sem testes funcionais profundos no MVP — apenas **testes simbólicos** (2-3 testes de componente) como prática educativa e item de rubrica. Validação principal via QA manual.
  - **CI:** GitHub Actions roda `npm test` no PR do back; falha bloqueia merge. No front, `npm run build` + os testes simbólicos rodam no PR.

---

## 9. Stack e fundamentação

### 9.1 Frontend — Next.js (+ camada BFF)

App Router, file-based routing, ecossistema React maduro. Integração nativa com Vercel para deploy. A camada **BFF** é implementada via **Route Handlers `/api/*`** (`app/api/.../route.ts`): leem o cookie `session`, injetam `X-Internal-Key` / `Bearer` / `X-Client-IP`, chamam o Nest e (login/logout) setam/apagam o cookie. **Helmet/CSP no Next** protege o browser.

### 9.2 Backend — Nest.js

Arquitetura modular com controllers, services, guards e injeção de dependência — adequada a um time grande dividido por domínio. Decoradores e DTOs facilitam validação e padronização. **Dois guards** (secret global + JWT nas protegidas). Documentação abundante para um time com nível técnico misto.

### 9.3 Banco — PostgreSQL + Prisma

Relacional adequado às entidades (User/Rating/Watched/Favorite, com chave composta `(userId, tmdbId, tmdbType)`). Prisma como ORM type-safe, com migrações simples versionadas no repositório.

### 9.4 Dados externos — TMDB API

Gratuita, com dados em PT-BR (sinopses, gêneros) e endpoint `watch/providers` cobrindo provedores BR — validado em spike antes do início do projeto. **Sempre consumida via Nest** (key nunca no browser).

### 9.5 Decisões de "por que não"

- **Django:** sugerido pelo professor; o time optou por JavaScript no back para unificar a stack com o front.
- **Fastify puro:** considerado inicialmente; trocado por Nest.js para ganhar estrutura modular adequada ao tamanho do time.
- **Monorepo:** decidido em discussão prévia, mas o time já criou dois repositórios separados; aceitamos a estrutura existente.
- **SPA cross-origin (browser↔Nest direto):** considerado até 29/05; **descartado** em favor do BFF — eliminou a escolha de CORS cross-site e tirou o token do browser. Ver §15 (30/05).
- **Render + Neon (PaaS free tier):** trocados (26/05) por Azure VM 24/7 com Docker compose, eliminando cold start e mitigando configuration drift.

---

## 10. Arquitetura macro

```
[Navegador]
    │  (same-origin: páginas + /api/*)
    ▼
[Vercel — Next.js + camada BFF]
    │  server-to-server: X-Internal-Key + Bearer (protegidas) + X-Client-IP
    ▼
[Azure VM (Docker compose)]
 ├─ container: Nest.js API (3000 → VM:80)  ── guard global de secret + guard JWT
 └─ container: PostgreSQL (5432, rede interna)
                    │
                    ▼
                [TMDB API]
```

- O **navegador nunca chama o Nest direto** — só o Next (páginas e `/api/*`).
- O **Next (BFF)** é a única origem que acessa o Nest; injeta a chave interna em toda chamada.
- Backend Nest.js intermedia TMDB, faz cache, persiste estado do usuário e valida os dois guards.
- Postgres armazena User, Rating, Watched, Favorite.

Diagrama detalhado: `docs/arquitetura.png` (a produzir).

---

## 11. Modelo de dados macro

Quatro modelos (`prisma/schema.prisma` no repositório back) — **inalterados nesta versão** (o BFF não cria tabela nova; sem blocklist no MVP):

- **User** — autenticação local (`email` unique, `passwordHash`, `name` validado conforme US-1.1).
- **Rating** — nota `Float` do usuário para um título (input restrito a **inteiro 1-10**; campo guarda como `Float` para deixar a porta aberta a meia-nota no futuro sem migration).
- **Watched** — marca "visto" do usuário; tem campo `origem` (`"manual"` ou `"auto"`) que define o comportamento ao remover a avaliação relacionada (ver US-4.1).
- **Favorite** — favorito do usuário.

Chave composta nas três últimas: `(userId, tmdbId, tmdbType)`. Sem CRUD próprio de filmes — toda referência ao título é via TMDB ID.

**`tmdbType` é enum no Prisma** (`MOVIE | TV`). Tradução para os valores da TMDB (`"movie"` / `"tv"`) acontece no service.

DER: `docs/banco_de_dados.png` (a produzir).

---

## 12. Visão das telas

Capturas vão em `docs/telas/` ao longo do desenvolvimento.

| Tela | Objetivo | Status |
|---|---|---|
| Home | Hero da marca (Plot Twist) + busca + chips de gênero ("Em alta" como padrão) + grade de destaques | a desenhar |
| Resultados de busca | Lista de cards (filme/série) | a desenhar |
| Ficha do título | Sinopse + provedores + ações | a desenhar |
| Login / Cadastro | Auth local (via BFF) | a desenhar |
| Perfil do usuário | Totais (3 contadores) + listas simples (poster + título + ano, 30 mais recentes) — ver US-4.4 | a desenhar |
| Erro / 404 | Estados de erro | a desenhar |

---

## 13. Backlog ágil

> Estrutura recomprimida para **02/07** (ver §16). **2 sprints de 2 semanas + fechamento**, sobre uma Sprint 0 de setup que corre em paralelo. Cada item vira issue no GitHub. Os planos operacionais detalhados por sprint (`sprint-N-plan.md`) e as issues são derivados deste backlog no passo seguinte.

### 13.1 Matriz de rastreabilidade (US ↔ épico ↔ sprint ↔ prioridade ↔ dependências)

| US | Épico | Sprint | Prioridade | Depende de | DoD (resumo) |
|---|---|---|---|---|---|
| US-1.1 Cadastro | E1 | S1 | **P0** | schema User | conta criada, hash, 409 em dup, sem cookie |
| US-1.2 Login | E1 | S1 | **P0** | US-1.1, BFF layer, JwtModule | login seta cookie `session` no Next, 401/429, F5 via `/me` |
| US-1.3 Logout | E1 | S1 | **P0** | US-1.2 | `POST /api/auth/logout` apaga cookie |
| US-2.1 Busca | E2 | S1 | **P0** | TMDB client, cache | busca multi, cards+badge, "carregar mais", 0-resultados |
| US-2.2 Ficha | E2 | S1 | **P0** | US-2.1 | ficha completa renderiza |
| US-3.1 Onde assistir | E3 | S1 | **P0** | US-2.2 | área destacada, flatrate, estado sem-provedor |
| US-4.1 Avaliação + auto-visto | E4 | S2 | **P0** | auth, ficha | nota 1-10, marca visto-auto, editar/remover c/ regra de origem |
| US-4.2 Visto manual | E4 | S2 | P1 | auth, ficha | marca visto-manual |
| US-4.3 Favorito | E4 | S2 | P1 | auth, ficha | favoritar/desfavoritar |
| US-4.4 Perfil | E4 | S2 | P1 | US-4.1/4.2/4.3 | 3 totais + 3 listas (30 itens) |
| US-2.3 Gêneros home | E2 | S2 | P1 | home base | chips single-select, discover |
| US-5.1 Dark/light | E5 | S2 | P1 | layout global | toggle, prefers-color-scheme, persist |
| US-5.2 Responsivo | E5 | S2 | P1 | telas principais | breakpoints básicos sem quebra |

**Itens transversais / infra (não-US), por sprint:**

| Item | Sprint | Prioridade | Nota |
|---|---|---|---|
| Front scaffold Next.js + CI básico | S0 | **P0** | bloqueia todo o front |
| Infra Azure VM + Docker compose + Bicep + Actions | S0 (paralela) | **P0** | PR #16 em curso |
| Camada BFF no front (route handlers `/api/*`) — *N3* | S1 | **P0** | maior trabalho novo do front |
| Guard global de chave interna (`X-Internal-Key`) — *N1* | S1 | **P0** | fecha o back |
| `GET /auth/me` + JwtStrategy + JwtAuthGuard — *N2* | S1 | **P0** | reaproveita `/auth/profile` do PR #21 |
| JwtModule + throttler + pino + cache-manager | S1 | **P0** | JwtModule já adiantado no PR #21 |
| Deploy online (Vercel prod + Azure VM) + **HTTPS no back** | S2 | **P0** | exigência do professor; HTTPS bloqueia uso real |
| Relatório UVA + DER + telas + README + e2e + apresentação | Fechamento | **P0** | entrega 02/07 |

### 13.2 Sprint 0 — Setup (em curso, paralela; fecha até ~07/06)

- [x] Scaffold Nest + Prisma + Postgres no back.
- [x] Criar branch `main` no back e definir como default no GitHub.
- [x] Convidar Eduardo Fernandes ao repo back.
- [ ] **Scaffold Next.js no front** (⏳ crítico — bloqueia todas as telas).
- [ ] CI básico no front (GitHub Actions: lint + build) — Vercel cuida do deploy.
- [ ] Infra do back: Azure VM via Bicep + `docker-compose.yml` + pipeline GitHub Actions estrita à `main` (PR #16).

### 13.3 Sprint 1 — Núcleo demonstrável (01–14/jun)

**Escopo P0:** E1 Auth completa **no modelo BFF** (US-1.1/1.2/1.3 + camada BFF N3 + guard interno N1 + `/auth/me` N2) · E2 Busca (US-2.1) · E2 Ficha (US-2.2) · E3 Onde assistir (US-3.1).

- [ ] **Dia 1 (kickoff):** acordar o contrato dos dois hops (browser↔Next↔Nest) das 5 rotas (§8.1) — front começa a mockar os `/api/*` imediatamente.
- [ ] Auth BFF de ponta a ponta (cadastro → login com cookie → `/auth/me` → logout).
- [ ] Busca + ficha + onde assistir.
- **Demo de fim de sprint:** criar conta → login → buscar "Oppenheimer" → abrir a ficha → ver onde assistir no Brasil. (Story arc fechado do núcleo.)

### 13.4 Sprint 2 — Histórico, perfil, UI e deploy (15–28/jun)

**Escopo:** E4 Avaliação + auto-visto (US-4.1, **P0**) · visto manual / favorito / perfil (US-4.2/4.3/4.4, P1) · E2 Gêneros na home (US-2.3, P1) · E5 Dark/light + responsivo (US-5.1/5.2, P1) · **Deploy online + HTTPS no back (P0)**.

- [ ] Histórico do usuário (avaliar/visto/favoritar) com ownership por `userId`.
- [ ] Perfil + gêneros na home + tema.
- [ ] **HTTPS no back** (Caddy/Traefik no compose **ou** Cloudflare proxy); validar com `curl https://<dominio>/health` antes de mergear.
- [ ] **Deploy do front na Vercel (production)** + validação e2e no ambiente publicado.
- **Demo de fim de sprint:** MVP completo **publicado online** (criar conta → login → buscar → ficha → onde assistir → avaliar → ver no perfil).

### 13.5 Fechamento (29/jun–02/jul)

- [ ] **Relatório acadêmico em PDF no template institucional da UVA** — capa, resumo, introdução, fundamentação, desenvolvimento, telas, backlog, versionamento, resultados, conclusão, referências.
- [ ] README finalizado nos 2 repos.
- [ ] DER e diagrama de arquitetura exportados em `docs/` nos 2 repos.
- [ ] Documentação das telas (`docs/telas/`) com print + descrição curta.
- [ ] **Validação end-to-end final** do deploy publicado.
- [ ] **Monitorar custos do Azure** — confirmar que cabe no plano escolhido.
- [ ] Empacotar código em `.zip` para envio via Teams + e-mail.
- [ ] Ensaio + **apresentação**. **ENTREGA: 02/07/2026.**

---

## 14. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **Cronograma recomprimido (8 → ~4,5 semanas)** até 02/07 | alta | alto | **Tiering P0/P1** (§5.1) com linha de corte explícita; núcleo demonstrável fechado já na Sprint 1; deploy antecipado para a Sprint 2 (não esperar o fechamento). |
| Time grande (13) com baixa disponibilidade individual (média 2-5h/semana) | alta | alto | Tasks pequenas e bem definidas; PO dedicado a desbloquear; PRD estruturado para reduzir reinterpretação e acelerar a implementação. |
| **Front carrega o maior peso novo da auth** (camada BFF — N3) | média | alto | BFF via Route Handlers `/api/*` (menor carga conceitual); contrato dos dois hops fechado no Dia 1; buy-in do Davi confirmado. |
| **Integração dos dois hops** (cookie no Next + Bearer/secret/X-Client-IP no Nest) falha na junção | média | médio | Mock dos `/api/*` no front desde o Dia 1; teste de `/auth/me` (rehidratação) e de rate-limit com `X-Client-IP` nos cenários obrigatórios (§8.3). |
| **PR #21 (auth) entrou off-spec** (refresh token, `/auth/profile`, login stub, senha mín. 6) | alta | médio | Realinhar na fase de issues: aproveitar JwtModule; `/auth/profile`→`/auth/me`; **remover `/auth/refresh`** (stretch); completar login (Prisma+bcrypt+`user`); senha mín. **8**. Ver §15. |
| TMDB pode não cobrir provedores para títulos de nicho | média | médio | Mostrar "não disponível em streaming BR" como estado válido. |
| Time não acostumado com fluxo de PR/issues no GitHub | média | médio | Documentar o fluxo no README do back; revisão coletiva nos primeiros PRs. |
| Front bloqueado esperando endpoints do back | alta | alto | Acordar **contrato no Dia 1 de cada sprint**; front mocka os `/api/*` enquanto back implementa; integração no fim da sprint. |

---

## 15. Decisões registradas

> Log **append-only** de decisões fechadas. Entradas novas no topo de cada bloco datado; entradas antigas **não** são reescritas (mesmo quando superadas — a superseção é anotada).

### 23/06/2026

- **Redesign da Home (marca Plot Twist) — o design passa a mandar no PRD.** A home foi redesenhada e o documento se ajusta. Mudanças: (1) **tema escuro vira o padrão** da primeira visita (supersede o "segue `prefers-color-scheme` / fallback light" de 24/05 e a US-5.1) — a marca é cinematográfica/escura; toggle e persistência mantidos; (2) **estado inicial "Em alta"** na home — sem gênero selecionado, exibe populares via discover **sem gênero** (supersede o chip "Todos = sem grade" de 24/05 e a US-2.3); (3) **"Plot Twist" é o nome público da marca** (§1), no hero e na metadata, enquanto "Guia de Streaming" segue como nome do projeto; (4) **home reordenada** para hero → busca → chips → grade, com fundo ambiente e animações da marca/busca (§7.1 / §12). Origem: redesign + verificação cruzada front × back × PRD de 23/06.
- **Contrato `discover` ganha `genre` opcional (ISSUE-BACK-30).** Para o "Em alta", `GET /titles/discover` passa a aceitar chamada **sem `genre`**, retornando os populares do momento (filmes + séries; a TMDB ordena por popularidade). Com `genre`, comportamento inalterado (BACK-24). Cache separa `trending` de cada gênero. Enquanto o back não publica a mudança, o front degrada com **fallback silencioso** (gênero curado).

### 30/05/2026

- **Auth migra para arquitetura BFF** (supersede a parte de auth de 24/05 e o cenário SPA cookie-no-Nest, descartado). Browser fala só com o Next; Next↔Nest server-to-server. JWT em **cookie `session` HttpOnly first-party no Next** + **Bearer interno** + **chave interna `X-Internal-Key`** (Caminho A, guard global). Dissolve a escolha de CORS cross-site. **Rate-limit no Nest** via `X-Client-IP` confiável pelo secret. **Logout no BFF** (sem endpoint no Nest, sem blocklist — stretch). **RBAC fora** (só ownership por `userId`); **telemetria stretch**; **Helmet** com CSP no Next. Motivo: upgrade de segurança (XSS-exfil mitigado) + conserto da inconsistência §10 (já era BFF) × §6/§8 (estilo SPA) + alinhamento ao que o front faria. Origem: review do Eduardo na issue #8 + Proposta Técnica. Detalhe em §8.1.
- **Cronograma recomprimido para a entrega de 02/07** (supersede o roadmap de 8 semanas da v1.1). **2 sprints de 2 semanas** (Sprint 1 núcleo demonstrável 01–14/jun; Sprint 2 histórico+UI+deploy 15–28/jun) **+ fechamento** (29/jun–02/jul), sobre a Sprint 0 de setup em paralelo. **Ficha (US-2.2) e Onde assistir (US-3.1) sobem para a Sprint 1** (eram S2 na v1.1) — o bloco de 2 semanas comporta e fecha um story arc demonstrável. Motivo: prazo real de ~4,5 semanas.
- **Tiering de prioridade P0/P1 dentro do MVP** (§5.1). P0 = núcleo inegociável para demo+nota (auth BFF, busca, ficha, onde assistir, avaliação+auto-visto, deploy, docs); P1 = comprometido mas primeira linha de corte (visto manual, favorito, perfil, gêneros na home, dark/light, responsivo). Dá linha de corte explícita sob pressão de prazo.
- **Realinhamento do PR #21 (auth) — entrou off-spec.** O PR #21 (`develop`, sem risco de deploy) trouxe JWT cedo. **Aproveitar:** JwtModule (BACK-01) e o `/auth/profile` (vira `/auth/me`, N2). **Corrigir na fase de issues:** remover `POST /auth/refresh` (refresh token é stretch §5.3); completar o login (validar contra Prisma + bcrypt, devolver `{access_token,user}` no corpo); subir senha mínima de 6 para **8** (US-1.1). Alinha com o extrator Bearer e o "Nest sem cookie" que o BFF já exige.

### 26/05/2026

- **Plataformas de deploy reformuladas** (supersede 24/05) após contraproposta técnica do back: **Vercel** (front Next.js) + **Azure VM 24/7 com Docker compose** (back NestJS + Postgres na mesma VM, rede interna, app `:3000→VM:80`, postgres `:5432` interna) + **Bicep** (IaC) + **GitHub Actions** (CI/CD estrita à `main`). Razões: Docker resolve configuration drift; VM 24/7 elimina cold start (era 15-30s no Render free); Postgres no mesmo compose evita Neon free tier.

### 24/05/2026

- Stack definida (22/05): Next.js + Nest.js + Prisma + PostgreSQL + TMDB; Fastify trocado por Nest.js; Prisma como ORM; TMDB validada para watch providers BR via spike (23/05).
- Aceitar 2 repos (não monorepo) — time já criou separados.
- MVP confirmado: filmes **e** séries. Sem comentários no MVP.
- **Deploy online obrigatório** — exigência do Prof. Paulo Andrade.
- **Admin fora do MVP** — sem RBAC, sem painel; moderação via banco se necessário.
- **Autenticação:** JWT com `@nestjs/jwt` + `passport-jwt`; senha em bcrypt/argon2; **token de 24h**; secret em `.env`; **sem refresh token no MVP**. *(Detalhe de entrega do token superado em 30/05 pelo BFF.)*
- **Fluxos de email fora do MVP:** confirmação de email e "esqueci minha senha" ficam em §5.3. Edição de perfil e deleção de conta pelo próprio usuário também fora.
- **Detalhes de auth:** logout só client-side; rate limit no login 5/15min por IP; validação de email via regex simples (sem MX lookup); senha mínima 8 caracteres sem complexidade obrigatória (NIST SP 800-63B). *(Logout/rate-limit reconfigurados pelo BFF em 30/05; senha mín. 8 mantida.)*
- **`tmdbType` vira enum Prisma** (`MOVIE | TV`); tradução para `"movie"`/`"tv"` no service.
- **Validação do nome do User:** trim + 3-50 caracteres + letras (acentos OK) / números / espaço / hífen / apóstrofe; sem unicidade.
- **Busca mistura filme e série** (`/search/multi` filtrando pessoa) com badge no card; **paginação via botão "Carregar mais"** (20 por página TMDB, acumula).
- **Filtros por gênero só na home, single-select, gêneros vindos da TMDB** (`/genre/movie/list` + `/genre/tv/list` em PT-BR, cache permanente). Chips com "Todos" como default. Não atuam em busca por texto no MVP.
- **Tema:** default segue o sistema via CSS `prefers-color-scheme`; fallback light; toggle sol/lua no header; preferência persistida em localStorage.
- **Cache TMDB em memória do Nest** (`@nestjs/cache-manager`, sem Redis) com TTLs diferenciados: gêneros permanentes; ficha 24h; provedores 12h; busca 1h. SLA: 200ms cache-hit / 2s cache-miss.
- **Estados de borda da UI definidos:** "0 resultados" na busca; "sem provedor BR" na ficha; falha de rede / 5xx / timeout TMDB (mensagem genérica + "Tentar de novo"); 404 do título (página dedicada). Sem geolocalização — `region=BR` hardcoded.
- **Biblioteca de UI do front delegada ao time de front** — decisão técnica deles.
- **Nota agregada do app** fica como stretch §5.3.
- **Granularidade da Avaliação:** input inteiro 1-10; schema mantém `score: Float` (sem migration) para meia-nota futura.
- **Edição e remoção de avaliação + `Watched.origem`:** trocar a nota atualiza sem duplicar; remover derruba o visto se `origem = "auto"` e mantém se `origem = "manual"`.
- **Perfil traz totais + listas simples** (US-4.4): poster + título + ano, 30 mais recentes, sem paginação/filtros no MVP.
- **Logger:** `nestjs-pino`, setup mínimo, sem `redact` paths. Regra dura: nunca logar senhas, tokens, body de auth. Sem log aggregation pago no MVP.
- **Cobertura de testes:** sem percentual forçado. Back tem cenários obrigatórios auditáveis por linha de teste; front tem testes simbólicos; resto via QA manual. CI bloqueia merge no back se testes falharem.
- **Sprint 1 (v1.1) reescopada:** Auth + Busca; Ficha/Onde-assistir em S2. *(Superado em 30/05: Ficha e Onde-assistir voltam para a Sprint 1 no cronograma recomprimido.)*
- **Favorito vs Quero ver (Watchlist):** Favorito é afetivo sem semântica temporal (like genérico); Watchlist é fora do MVP (§5.3), lista separada quando entrar, sem migration dos favoritos.

---

## 16. Roadmap até 02/07

| Período | Bloco | Foco | Marco |
|---|---|---|---|
| até ~07/06 | S0 (paralela) | Front scaffold + infra Azure (PR #16) + CI front | Ambos repos rodando local + pipeline de pé |
| 01–14/jun | **Sprint 1** | Auth **BFF** + busca + ficha + onde assistir | Demo "criar conta → login → buscar → ficha → onde assistir" |
| 15–28/jun | **Sprint 2** | Histórico + perfil + gêneros + dark/UI + **deploy online** | Demo MVP completo **publicado** (Vercel + Azure VM) |
| 29/jun–02/jul | Fechamento | Relatório UVA + telas + README + e2e + ensaio | **Entrega final 02/07** |

---

## 17. Repositórios

- Backend: https://github.com/luizpassaroni/lab-dev-software-back
- Frontend: https://github.com/luizpassaroni/lab-dev-software-front
