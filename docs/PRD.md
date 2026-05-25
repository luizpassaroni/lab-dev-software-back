# PRD — Guia de Streaming

**Versão:** 1.0
**Autor:** Caio Planinschek (PO)
**Data:** 24/05/2026
**Audiência:** time do projeto Guia de Streaming
**Status:** ativo

---

## 1. Resumo executivo

O **Guia de Streaming** é um webapp para usuários brasileiros descobrirem **em qual catálogo de streaming** um filme ou série está disponível, consolidando busca, ficha completa e provedores em uma única interface, sem precisar consultar JustWatch, IMDb e o app de cada streaming separadamente. O MVP cobre cadastro, busca, ficha de filme/série, indicação de "onde assistir" via TMDB API (região BR), avaliação 1-10, marcação de "visto", favoritos e tema claro/escuro, em ~8 semanas com time de 13 integrantes.

---

## 2. Contexto e problema

### 2.1 Problema

Usuários de múltiplos serviços de streaming (Netflix, Prime Video, Disney+, HBO Max, Globoplay, Apple TV+) gastam tempo procurando manualmente em cada app onde um título específico está disponível. Sites como JustWatch resolvem isso parcialmente, mas a informação fica enterrada em widgets pequenos no IMDb ou em listas pouco objetivas.

### 2.2 Público-alvo

Brasileiros entre 18-45 anos que assinam dois ou mais serviços de streaming e consomem regularmente filmes e séries.

### 2.3 Por que agora (contexto acadêmico)

O projeto é a entrega da disciplina Laboratório de Desenvolvimento de Software (UVA 2026.1). Combina prática real de produto (PO, levantamento, backlog) com construção de aplicação web full-stack que integra API externa pública (TMDB).

---

## 3. Objetivos

### 3.1 Objetivos do produto

- Permitir que um usuário não-logado encontre rapidamente onde assistir um título específico.
- Permitir que um usuário logado mantenha um histórico pessoal de filmes/séries vistos, avaliados e favoritados.
- Construir uma experiência limpa em desktop, com responsivo básico para tablets e celulares.

### 3.2 Objetivos pedagógicos

- Praticar desenvolvimento full-stack com Next.js + Nest.js.
- Exercitar modelagem relacional com Prisma + PostgreSQL.
- Integrar API externa (TMDB) com tratamento de erro e cache.
- Trabalhar em time grande com cerimônias ágeis enxutas, organizando via GitHub Projects/Issues.

### 3.3 Critérios de sucesso observáveis

- [ ] Usuário não-logado consegue buscar "Oppenheimer" e ver os streamings BR onde assistir, em menos de 2 cliques a partir da home.
- [ ] Usuário logado consegue avaliar um filme com nota 1-10; sistema marca automaticamente como "visto".
- [ ] Apresentação final demonstra o fluxo completo em ambiente local sem crash.
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

### 5.1 Dentro do escopo

- Cadastro e login (email + senha; hash bcrypt/argon2).
- Busca de filmes **e séries** (TMDB API, região BR).
- Ficha do título: sinopse, poster, elenco, duração/temporadas, nota TMDB, provedores BR.
- Indicação "onde assistir" com destaque visual (área dedicada na ficha).
- Avaliação 1-10 (usuário logado; marca como visto automaticamente).
- Marcação manual de "visto" e "favorito".
- Perfil do usuário: nome, data de criação, totais (vistos / avaliados / favoritos) e listas simples dos 30 itens mais recentes de cada uma.
- Home com barra de busca, destaques e filtros por gênero.
- Dark mode e light mode (obrigatório).
- Responsividade básica em desktop (foco principal).

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
- **Nota agregada do Guia de Streaming** na ficha — média das avaliações dos usuários do nosso app, exibida apenas se houver pelo menos N avaliações (N a definir na implementação; sugestão inicial: 5). Distinta de **Nota TMDB** (vem da TMDB) e de **Minha nota** (individual, vista só pelo dono no perfil).
- **Filtros, ordenação selecionável e paginação nas listas do perfil** (vistos/avaliados/favoritos) — MVP traz só os 30 mais recentes ordenados por data; stretch traz busca dentro da lista, ordenação por título/data/nota, e paginação para histórico inteiro.
- **Filtro por gênero dentro de resultados de busca por texto** e **multi-select de gêneros** (ex: "Ação + Comédia") — MVP traz só single-select na home; stretch combina filtros com a busca textual e permite combinar gêneros.
- **Refresh token automático** — MVP usa JWT de 24h sem renovação; stretch adiciona refresh token com rotação para renovação silenciosa em background, eliminando a tela de login durante a sessão.
- **Confirmação de email + recuperação de senha** — pacote acoplado, depende de integrar serviço de envio de email (Resend / SendGrid free / equivalente); inclui telas "confirme seu email", token de ativação, fluxo "esqueci minha senha", token de reset com expiração curta.
- **Blocklist de tokens no logout (logout server-side)** — MVP descarta token só no client; stretch adiciona tabela de tokens revogados consultada por guard no back, garantindo invalidação imediata no logout.

---

## 6. Funcionalidades — épicos e user stories

### Épico E1 — Autenticação

- **US-1.1** Como visitante, quero criar uma conta com email e senha para acessar funcionalidades logadas.
  - [ ] Validação básica de email via regex (presença de `@` e ponto depois) — sem chamada externa, sem MX lookup.
  - [ ] Senha mínima 8 caracteres, **sem exigir** complexidade obrigatória (letra/número/símbolo) — alinha com NIST SP 800-63B.
  - [ ] Hash da senha no banco com bcrypt ou argon2 (nunca em texto plano, nunca hash simples como MD5/SHA1).
  - [ ] Email é único no banco (`@unique` no Prisma).
  - [ ] **Nome:** trim automático; mínimo 2 caracteres após trim; máximo 60; aceita letras (com acento), números, espaços, hífen e apóstrofe; **não exige unicidade**.

- **US-1.2** Como usuário, quero fazer login para acessar minha conta.
  - [ ] Sessão via JWT no header `Authorization: Bearer`.
  - [ ] Token com expiração de **24h**.
  - [ ] Ao expirar, próxima requisição protegida retorna 401 e o front redireciona para a tela de login.
  - [ ] **Rate limit** no endpoint de login: máximo 5 tentativas a cada 15 minutos por IP (`@nestjs/throttler`); excedido retorna 429.

- **US-1.3** Como usuário, quero fazer logout.
  - [ ] Logout é **só client-side** no MVP: front apaga o token do storage do navegador.
  - [ ] **Sem blocklist no back** — token continua tecnicamente válido até expirar naturalmente em 24h (blocklist server-side movido para §5.3).

### Épico E2 — Catálogo (busca e ficha)

- **US-2.1** Como visitante ou logado, quero buscar por filme ou série pelo nome.
  - [ ] Tempo de resposta dentro do orçamento de §8 (200ms cache-hit / 2s cache-miss / 30s tolerado em cold start).
  - [ ] **Filmes e séries vêm juntos** em uma única lista (back usa `/search/multi`, filtra fora resultados de pessoa).
  - [ ] Cards mostram poster + título + ano + **badge visual indicando filme ou série**.
  - [ ] Paginação via **botão "Carregar mais" no rodapé** (20 resultados por página da TMDB; cada clique acumula mais 20).
  - [ ] Quando não há mais páginas, esconder o botão.
  - [ ] **Estado "0 resultados":** ícone discreto + texto "Nenhum resultado para '<query>'. Tente outro termo.".

- **US-2.2** Como visitante ou logado, quero ver a ficha completa de um título.
  - [ ] Sinopse, poster, elenco principal, duração/temporadas, nota TMDB.
  - [ ] Tags de gênero.

- **US-2.3** Como visitante ou logado, quero descobrir títulos navegando por gênero a partir da home.
  - [ ] Chips horizontais clicáveis no topo da home: "Todos | Ação | Comédia | Drama | Terror | ..." (lista vem da TMDB via `/genre/movie/list` + `/genre/tv/list` em PT-BR, com cache permanente no back).
  - [ ] **Single-select**: um gênero ativo por vez; clicar no chip ativo de novo volta para "Todos".
  - [ ] Quando um gênero é selecionado, exibir destaques daquele gênero via TMDB `/discover/movie?with_genres=X` (e equivalente `/discover/tv`).
  - [ ] Filtro **não** atua dentro de resultados de busca por texto no MVP (vai para §5.3).

### Épico E3 — Onde assistir

- **US-3.1** Como visitante ou logado, quero ver em qual streaming brasileiro o título está disponível.
  - [ ] Área visualmente destacada na ficha (definida no design).
  - [ ] Logos dos provedores listados.
  - [ ] Categorias TMDB: flatrate (assinatura), rent (aluguel), buy (compra) — exibir pelo menos flatrate.
  - [ ] **Estado "sem provedor BR":** quando a TMDB não retorna provedores para `region=BR`, exibir mensagem discreta "Este título não está disponível em provedores de streaming no Brasil." dentro da área de "Onde assistir"; resto da ficha (sinopse, poster, elenco, nota TMDB) continua normalmente.

### Épico E4 — Histórico do usuário

- **US-4.1** Como logado, quero avaliar um filme/série com nota de 1 a 10, podendo trocar ou remover a avaliação depois.
  - [ ] Sistema marca automaticamente como "visto" ao receber avaliação (`Watched.origem = "auto"`).
  - [ ] Não permite desmarcar "visto" enquanto houver avaliação registrada.
  - [ ] Trocar a nota **atualiza** a avaliação existente, sem criar registro duplicado e sem confirmação extra.
  - [ ] Remover a avaliação é permitido; se o "visto" foi marcado pela própria avaliação (`origem = "auto"`), o "visto" cai junto; se foi marcado manualmente antes (`origem = "manual"`), o "visto" permanece.

- **US-4.2** Como logado, quero marcar título como visto sem precisar avaliar (`Watched.origem = "manual"`).

- **US-4.3** Como logado, quero favoritar título.

- **US-4.4** Como logado, quero ver meu perfil com totais **e listas simples** (vistos / avaliados / favoritos).
  - [ ] Três contadores no topo: vistos, avaliados, favoritos.
  - [ ] Três listas correspondentes, cada uma com **poster + título + ano** de cada item.
  - [ ] Ordenação: mais recente primeiro (por `Watched.watchedAt`, `Rating.createdAt`, `Favorite.createdAt`).
  - [ ] Limite de 30 itens mais recentes por lista — sem paginação no MVP.
  - [ ] Sem filtros internos no MVP (filtros, ordenação selecionável e paginação vão para §5.3).
  - [ ] Na lista de avaliados, exibir também a nota dada pelo usuário.

### Épico E5 — Tema e UI

- **US-5.1** Como usuário, quero alternar entre dark e light mode.
  - [ ] **Default na primeira visita:** segue o sistema operacional via CSS `prefers-color-scheme`; fallback para light se o sistema não opinar.
  - [ ] Toggle (ícone sol/lua) sempre visível no header global, canto direito.
  - [ ] Preferência persistida no navegador (localStorage) — uma vez tocado, a escolha do usuário sobrescreve o sistema.

- **US-5.2** Como usuário, quero usar o site com layout responsivo básico em desktop.

---

## 7. Fluxos principais

### 7.1 Onboarding → primeira busca

Visitante chega na home → vê barra de busca + destaques → pode pesquisar sem login → clica em título → vê ficha → vê "onde assistir" → se quer avaliar/favoritar, é levado para o cadastro/login → após login, volta para a ficha.

### 7.2 Avaliação que marca como visto

Usuário logado abre ficha → clica em avaliar → escolhe nota 1-10 → confirma → sistema persiste avaliação + marca `Watched` automaticamente → ficha atualiza estado visual.

### 7.3 Busca → "onde assistir"

Usuário (qualquer) digita query → backend chama TMDB `/search/multi` → retorna lista → usuário clica → backend chama TMDB `/movie/{id}` ou `/tv/{id}` + `/watch/providers` com `region=BR` → frontend renderiza ficha com área destacada de provedores.

---

## 8. Requisitos não-funcionais

- **Desempenho:**
  - **Cache-hit** (chamada TMDB já cacheada): resposta em até **200ms**.
  - **Cache-miss** (chamando TMDB pela primeira vez): resposta em até **2s**.
  - **Primeira requisição após cold start** (free tier do back inativo): até **30s** — aceito como limitação do plano gratuito (mitigação: "esquentar" a instância antes da apresentação, ver §14).
- **Cache TMDB:** via `@nestjs/cache-manager` em memória do processo Nest (sem Redis no MVP). TTLs diferenciados por endpoint:
  - Lista de gêneros (`/genre/movie/list`, `/genre/tv/list`): **permanente até restart do processo**.
  - Ficha do título (`/movie/{id}`, `/tv/{id}`): **24h**.
  - Provedores (`/movie/{id}/watch/providers`, equivalente tv): **12h**.
  - Busca (`/search/multi`): **1h**.
- **Autenticação:** JWT via `@nestjs/jwt` + `passport-jwt`; token com expiração de **24h**; **sem refresh token no MVP** (movido para §5.3 stretch); ao expirar, app redireciona para tela de login; secret em variável de ambiente (`.env`), nunca commitada.
- **Segurança:** hash de senha com **bcrypt** ou **argon2** (nunca texto plano nem hash simples); validação de input em todos os endpoints (`class-validator` via Nest DTOs); HTTPS obrigatório em produção; **rate limit** no endpoint de login (5 tentativas / 15 min por IP via `@nestjs/throttler`).
- **Deploy:** aplicação **deve estar acessível online** (exigência do Prof. Paulo Andrade). Plataformas escolhidas:
  - **Front (Next.js): Vercel** — integração nativa, deploy automático via GitHub.
  - **Back (Nest.js): Render** — free tier, deploy via git; cold start de 15-30s após 15min de inatividade aceito (mitigado em §14).
  - **Banco (PostgreSQL): Neon** — Postgres serverless gerenciado, free tier generoso, sem pause arbitrário.
  - Variáveis sensíveis (TMDB API key, JWT secret, `DATABASE_URL`) ficam nas configurações de cada plataforma; nunca commitadas.
- **Responsividade:** foco desktop, responsivo básico via breakpoints CSS para tablets/celulares.
- **Acessibilidade:** contraste mínimo WCAG AA em ambos os temas (dark/light).
- **i18n:** UI em PT-BR; sem multilíngue.
- **Logging:** `nestjs-pino`. Setup mínimo: `LoggerModule.forRoot()` no `AppModule` com defaults; sem `pino-pretty` em produção (Render captura JSON puro do stdout); em dev `pino-pretty` é opcional para legibilidade. Campos por log: `level`, `time` (automático), `context` (`auth`/`tmdb`/`db`), `msg`, `userId` quando aplicável, `err.stack` quando aplicável. **Nunca logar:** senhas (mesmo erradas), tokens JWT, body de request de login/cadastro — regra dura, **sem `redact` paths configurado** (overkill para o MVP; checar visualmente no PR). **Onde logar (mínimo):** erros 5xx da TMDB; tentativas de login com senha errada e rate limit atingido; erros não-tratados via exception filter global. **Sem Sentry / Datadog / log aggregation pago no MVP** — retenção é a do free tier do Render (~7 dias).
- **Tratamento de erros na UI:**
  - **Falha de rede / erro 5xx / timeout TMDB:** front mostra mensagem genérica "Não foi possível carregar agora. Tente novamente." + botão "Tentar de novo" que refaz a chamada. Detalhes técnicos só nos logs.
  - **404 / título não encontrado:** página "Título não encontrado" com link "Voltar para a home" (ver §12).
  - **Acesso fora do BR:** o app envia `region=BR` para a TMDB independente de onde o usuário está; sem detecção de geolocalização, sem warning, sem bloqueio.
- **Testes:**
  - **Back (Jest 30):** sem percentual de cobertura forçado. **Lista de cenários obrigatórios** que precisam existir como teste:
    - `auth.service`: cadastro com sucesso; cadastro com email duplicado (409 ou erro de validação); login com sucesso (retorna JWT válido); login com senha errada (401); login com email inexistente (401, sem revelar que o email não existe); rate limit dispara após 5 tentativas em 15min (429).
    - `titles.service` (TMDB integration): search com sucesso (retorna lista com poster/título/ano/badge); cache hit não chama TMDB de novo (mock zera chamadas na 2ª requisição); erro de rede da TMDB retorna 5xx tratado sem crash do back.
  - **Front:** sem testes funcionais profundos no MVP — apenas **testes simbólicos** (2-3 testes de componente, ex: "Botão de login chama submit ao clicar"; "Card de resultado renderiza badge filme/série") como prática educativa e item visível na rubrica acadêmica. Validação principal via QA manual.
  - **CI:** GitHub Actions roda `npm test` no PR do back; falha bloqueia merge. No front, `npm run build` + os testes simbólicos rodam no PR.

---

## 9. Stack e fundamentação

### 9.1 Frontend — Next.js

App Router, file-based routing, ecossistema React maduro. Integração nativa com Vercel para deploy. Suporte a SSR/SSG quando aplicável.

### 9.2 Backend — Nest.js

Arquitetura modular com controllers, services, guards e injeção de dependência — adequada a um time grande dividido por domínio. Decoradores e DTOs facilitam validação e padronização. Documentação abundante para um time com nível técnico misto.

### 9.3 Banco — PostgreSQL + Prisma

Relacional adequado às entidades (User/Rating/Watched/Favorite, com chave composta `(userId, tmdbId, tmdbType)`). Prisma como ORM type-safe, com migrações simples versionadas no repositório.

### 9.4 Dados externos — TMDB API

Gratuita, com dados em PT-BR (sinopses, gêneros) e endpoint `watch/providers` cobrindo provedores BR — validado em spike antes do início do projeto.

### 9.5 Decisões de "por que não"

- **Django:** foi sugerido pelo professor; o time optou por JavaScript no back para unificar a stack com o front e reaproveitar conhecimento.
- **Fastify puro:** considerado inicialmente; trocado por Nest.js para ganhar estrutura modular adequada ao tamanho do time.
- **Monorepo:** decidido em discussão prévia, mas o time já criou dois repositórios separados; aceitamos a estrutura existente em vez de retrabalhar.

---

## 10. Arquitetura macro

```
[Navegador] → [Next.js Frontend] → [Nest.js API] → [PostgreSQL]
                                          ↓
                                      [TMDB API]
```

- Frontend Next.js consome a API do backend (sem chamar TMDB direto).
- Backend Nest.js intermedia TMDB, faz cache, persiste estado do usuário.
- Postgres armazena User, Rating, Watched, Favorite.

Diagrama detalhado: `docs/arquitetura.png` (a produzir).

---

## 11. Modelo de dados macro

Quatro modelos atuais (`prisma/schema.prisma` no repositório back):

- **User** — autenticação local (`email` unique, `passwordHash`, `name` validado conforme US-1.1).
- **Rating** — nota `Float` do usuário para um título (input restrito a **inteiro 1-10**; campo guarda como `Float` para deixar a porta aberta a meia-nota no futuro sem precisar de migration).
- **Watched** — marca "visto" do usuário para um título; tem campo `origem` (`"manual"` ou `"auto"`) que define o comportamento ao remover a avaliação relacionada (ver US-4.1).
- **Favorite** — favorito do usuário.

Chave composta nas três últimas: `(userId, tmdbId, tmdbType)`. Sem CRUD próprio de filmes — toda referência ao título é via TMDB ID.

**`tmdbType` é enum no Prisma** (`MOVIE | TV`). Tradução para os valores da TMDB (`"movie"` / `"tv"`) acontece no service.

DER: `docs/banco_de_dados.png` (a produzir).

---

## 12. Visão das telas

Capturas vão em `docs/telas/` ao longo do desenvolvimento.

| Tela | Objetivo | Status |
|---|---|---|
| Home | Busca, destaques, filtros por gênero | a desenhar |
| Resultados de busca | Lista de cards (filme/série) | a desenhar |
| Ficha do título | Sinopse + provedores + ações | a desenhar |
| Login / Cadastro | Auth local | a desenhar |
| Perfil do usuário | Totais (3 contadores) + listas simples (poster + título + ano, 30 mais recentes, sem filtros/paginação) — ver US-4.4 | a desenhar |
| Erro / 404 | Estados de erro | a desenhar |

---

## 13. Backlog ágil

Estrutura em sprints curtas (1-2 semanas). Cada item vira issue no GitHub.

### Sprint 0 — Setup (semana 1, em andamento)

- [x] Scaffold Nest + Prisma + Postgres no back.
- [x] Criar branch `main` no back e definir como default no GitHub.
- [x] Convidar Eduardo Fernandes ao repo back.
- [ ] Scaffold Next.js no front.
- [ ] CI básico (GitHub Actions: lint + build) nos 2 repos.

### Sprint 1 — Auth + busca (semanas 2-3)

- [ ] **Dia 1 (kickoff S1):** acordar contrato das 3 APIs com o front (path, payload, response, códigos de erro) — front começa a mockar imediatamente, sem esperar implementação do back.
- [ ] E1 Autenticação completa (US-1.1 a 1.3).
- [ ] E2 Busca TMDB (US-2.1).
- [ ] Demo de fim de sprint: criar conta → fazer login → buscar "Oppenheimer" → ver lista de resultados.

### Sprint 2 — Ficha + Onde assistir + histórico (semanas 4-5)

- [ ] Ficha básica (US-2.2) — pré-requisito de US-3.1.
- [ ] E3 Onde assistir (US-3.1).
- [ ] E4 Avaliação + visto + favorito (US-4.1 a 4.4).

### Sprint 3 — Polimento + UI (semanas 6-7)

- [ ] E5 Dark/light mode (US-5.1, 5.2).
- [ ] Home com destaques e filtros por gênero (US-2.3).
- [ ] Perfil do usuário (US-4.4).

### Sprint 4 — Fechamento e deploy (semana 8)

- [ ] **Deploy do back** no **Render** (free tier; aceitar cold start de 15-30s; "esquentar" instância antes da apresentação).
- [ ] **Deploy do front** na **Vercel**.
- [ ] **Deploy do banco** no **Neon** (free tier; Postgres serverless).
- [ ] **Relatório acadêmico em PDF no template institucional da UVA** — capa, resumo, introdução, fundamentação, desenvolvimento, telas, backlog, versionamento, resultados, conclusão, referências.
- [ ] README finalizado nos 2 repos.
- [ ] DER e diagrama de arquitetura exportados em `docs/` nos 2 repos.
- [ ] Documentação das telas (`docs/telas/`) com print + descrição curta.
- [ ] Empacotar código em `.zip` para envio via Teams + e-mail.
- [ ] Testes e ajustes finais.
- [ ] Apresentação.

---

## 14. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Time grande (13) com baixa disponibilidade individual (média 2-5h/semana) | alta | alto | Tasks pequenas e bem definidas; PO dedicado a desbloquear. |
| Mix de níveis técnicos e disponibilidade variável (algumas pessoas com horas limitadas por semana) | alta | médio | Documentar bem o setup; pair programming nas issues complexas. |
| TMDB pode não cobrir provedores para títulos de nicho | média | médio | Mostrar "não disponível em streaming BR" como estado válido. |
| Free tier do back (cold start no Render após inatividade) atrapalha apresentação | média | médio | Acordar a instância antes da apresentação; manter URL deployada por todo o ciclo final, não só na entrega. |
| Limites do Neon free (timeouts de conexão, pause após dias inativos) | média | médio | Validar limites antes da Sprint 4; ter plano B (Render Postgres como fallback). |
| Time não acostumado com fluxo de PR/issues no GitHub | média | médio | Documentar o fluxo no README do back; revisão coletiva nos primeiros PRs. |
| **Front bloqueado esperando endpoints do back** (auth, busca, ficha) — atrasa S1 inteira | alta | alto | Acordar **contrato das APIs no dia 1 de cada sprint** (path, request, response, códigos de erro) por escrito; front mocka a resposta enquanto back implementa; integração no fim da sprint. |

---

## 15. Decisões registradas

Log de decisões fechadas até a publicação desta versão.

- **22/05/2026** Stack definida: Next.js + Nest.js + Prisma + PostgreSQL + TMDB.
- **22/05/2026** Trocar Fastify por Nest.js para ganhar estrutura modular adequada ao tamanho do time.
- **22/05/2026** Prisma como ORM, com migrações versionadas.
- **23/05/2026** TMDB validada para watch providers BR (filmes e séries) via spike.
- **24/05/2026** Aceitar 2 repos (não monorepo) — time já criou separados.
- **24/05/2026** MVP confirmado: filmes **e** séries.
- **24/05/2026** Sem comentários no MVP — complexidade fora do escopo.
- **24/05/2026** **Deploy online obrigatório** — exigência do Prof. Paulo Andrade.
- **24/05/2026** **Admin fora do MVP** — sem RBAC, sem painel; em caso de necessidade de moderação, exclusão manual via banco.
- **24/05/2026** **Autenticação:** JWT com `@nestjs/jwt` + `passport-jwt`; senha em bcrypt/argon2; **token de 24h**; secret em `.env`; **sem refresh token no MVP**. Razão: balança UX razoável (1 login por dia útil) com simplicidade de Sprint 1; risco de roubo de token aceitável para app de filmes sem dados sensíveis.
- **24/05/2026** **Fluxos de email fora do MVP:** confirmação de email no cadastro e "esqueci minha senha" ficam em §5.3 (pacote acoplado, depende de integrar serviço de envio). Edição de perfil e deleção de conta pelo próprio usuário também fora — alteração via banco se necessário.
- **24/05/2026** **Detalhes de auth:** logout só client-side (front descarta o token; sem blocklist no back); rate limit no login com `@nestjs/throttler` (5 tentativas / 15 min por IP); validação de email via regex simples no DTO (sem MX lookup); senha mínima 8 caracteres **sem** complexidade obrigatória (alinha NIST SP 800-63B).
- **24/05/2026** **`tmdbType` vira enum Prisma** (`MOVIE | TV`); tradução para `"movie"`/`"tv"` da TMDB feita no service.
- **24/05/2026** **Validação do nome do User:** trim + 2-60 caracteres + letras (acentos OK) / números / espaço / hífen / apóstrofe; sem unicidade (email é o identificador). Implementado via DTO.
- **24/05/2026** **Busca mistura filme e série** (`/search/multi` filtrando pessoa) com badge no card distinguindo o tipo; **paginação via botão "Carregar mais"** (20 por página TMDB, acumula). Alinha com padrão do mercado (JustWatch/Letterboxd).
- **24/05/2026** **Filtros por gênero só na home, single-select, gêneros vindos da TMDB** (`/genre/movie/list` + `/genre/tv/list` em PT-BR, cache permanente). Chips horizontais clicáveis com "Todos" como default. Filtros não atuam em resultados de busca por texto no MVP.
- **24/05/2026** **Tema:** default segue o sistema operacional via CSS `prefers-color-scheme`; fallback light se o sistema não opinar; toggle sol/lua no header; preferência persistida em localStorage uma vez tocada.
- **24/05/2026** **Cache TMDB em memória do Nest** (`@nestjs/cache-manager`, sem Redis no MVP) com TTLs diferenciados: gêneros permanentes até restart; ficha 24h; provedores 12h; busca 1h. **SLA reformulado em três faixas:** 200ms cache-hit / 2s cache-miss / até 30s tolerado em cold start do free tier.
- **24/05/2026** **Estados de borda da UI definidos:** "0 resultados" na busca (mensagem discreta); "sem provedor BR" na ficha (mensagem dentro da área de "Onde assistir", resto da ficha permanece); falha de rede / 5xx / timeout TMDB (mensagem genérica + botão "Tentar de novo"); 404 do título (página dedicada). **Sem detecção de geolocalização** — `region=BR` hardcoded mesmo para usuários fora do BR.
- **24/05/2026** **Plataformas de deploy fechadas:** **Vercel** (front Next.js), **Render** (back Nest, free tier com cold start aceito), **Neon** (banco Postgres, free tier sem pause). Combinação mais barata operacionalmente, sem fricção de Docker, sem expiração de free tier do banco.
- **24/05/2026** Biblioteca de UI do front delegada ao time de front — decisão técnica deles.
- **24/05/2026** **Nota agregada do app** (média das avaliações dos usuários do Guia de Streaming) fica como **stretch §5.3**, fora do MVP. Posicionamento de "histórico pessoal, sem componente social"; base inicial pequena torna a média estatisticamente fraca.
- **24/05/2026** **Granularidade da Avaliação:** input do usuário é **inteiro 1-10**; schema mantém `score: Float` (sem migration) para preservar a opção futura de meia-nota.
- **24/05/2026** **Edição e remoção de avaliação + `Watched.origem`:** trocar a nota atualiza a avaliação existente (sem confirmação, sem duplicar). Remover é permitido; o "visto" some junto se foi marcado pela avaliação (`origem = "auto"`) e permanece se foi marcado manualmente antes (`origem = "manual"`). Watched ganha campo `origem` para suportar essa regra.
- **24/05/2026** **Perfil traz totais + listas simples** (US-4.4): poster + título + ano, 30 mais recentes por lista, sem paginação/filtros/ordenação selecionável no MVP. Filtros/paginação ficam em §5.3.
- **24/05/2026** **Logger:** `nestjs-pino` no back. Setup mínimo, sem `pino-pretty` em prod, sem `redact` paths. JSON estruturado capturado pelo stdout do Render. Regra dura: nunca logar senhas, tokens, body de auth. Sem log aggregation pago no MVP.
- **24/05/2026** **Cobertura de testes:** sem percentual forçado. **Back** tem lista de cenários obrigatórios (9 cenários entre `auth.service` e `titles.service` — ver §8) auditáveis por linha de teste, não por número. **Front** tem testes simbólicos (2-3 testes de componente como prática educativa e item de rubrica), sem disciplina de TDD; resto da validação é QA manual. CI bloqueia merge no back se testes falharem.
- **24/05/2026** **Sprint 1 reescopo:** mover US-2.2 (Ficha básica) para Sprint 2, junto com US-3.1 Onde assistir (que depende dela). Sprint 1 = Auth completa (US-1.1/1.2/1.3) + Busca (US-2.1). Demo S1 fica com story arc fechado ("criar conta → buscar → ver lista"). Mitigação concreta para dependência front↔back adicionada como linha nova em §14 (contrato de API acordado no dia 1 + mock no front).
- **24/05/2026** **Favorito vs Quero ver (Watchlist):** Favorito é **afetivo sem semântica temporal** — pode ser marcado antes ou depois de assistir; funciona como *like* genérico. Watchlist é **fora do MVP** e quando entrar via §5.3 será uma lista **separada e adicional** chamada canonicamente **"Quero ver"**, com o mesmo título podendo coexistir em Favoritos e em Quero ver, e **sem migration** dos favoritos existentes.

---

## 16. Roadmap de 8 semanas

| Semana | Sprint | Foco | Marco |
|---|---|---|---|
| 1 | S0 | Setup completo back + front | Ambos repos rodando local |
| 2-3 | S1 | Auth + busca | Demo "criar conta → buscar Oppenheimer → ver lista" |
| 4-5 | S2 | Ficha + onde assistir + histórico | Demo MVP completo |
| 6-7 | S3 | UI polida + dark mode + perfil | UI final, testes manuais |
| 8 | S4 | Documentação + apresentação | Entrega final |

---

## 17. Repositórios

- Backend: https://github.com/luizpassaroni/lab-dev-software-back
- Frontend: https://github.com/luizpassaroni/lab-dev-software-front
