# Sprint 1 — Issues do Backend

> **Duração:** semanas 2-3 | **Repo:** `lab-dev-software-back`
> **Doc-fonte:** `docs/PRD.md` + `_notas-projeto/sprint-1-plan.md`
> **Total:** 16 issues (1 Sprint 0 infra paralela + 15 Sprint 1)
> **Como usar:** cada bloco `## ISSUE-BACK-NN` é uma issue independente no GitHub. Copiar título + corpo. Owner é definido no kickoff (Dia 1), exceto `ISSUE-BACK-00`, planejada para Eduardo Fernandes.

**Convenções:**

- Labels GitHub a criar: `sprint-0`, `sprint-1`, `back`, `epic:auth`, `epic:catalogo`, `epic:infra`, `epic:testes`, `epic:meta`
- Referências `PRD §X` apontam para `docs/PRD.md`
- Branch por issue: `feat/back-NN-slug-curto` (ex: `feat/back-06-auth-register`)

---

## ISSUE-BACK-00 — [infra] Azure VM + Docker compose + Bicep + GitHub Actions

**Labels:** `sprint-0` `back` `epic:infra`
**Sprint:** Sprint 0 — paralela à Sprint 1
**Owner planejado:** Eduardo Fernandes
**Branch/PR esperado:** `feat/infra-cicd`
**US:** — (RNF / Deploy — PRD §8 e §13)
**Depende de:** —

### Contexto

O PRD v1.1 reformulou a stack de deploy: front na Vercel; back e Postgres em uma Azure VM 24/7 com Docker compose; infraestrutura via Bicep; CI/CD via GitHub Actions com pipeline estrita à `main`. Esta issue não faz parte da demo funcional da Sprint 1, mas roda em paralelo para alinhar o back com o caminho de produção definido no PRD.

### Critérios de aceite

- [ ] Azure VM provisionada via Bicep
- [ ] `docker-compose.yml` com API NestJS e PostgreSQL em **containers separados**
- [ ] Container Postgres na rede interna do Docker, sem exposição pública da porta `5432`
- [ ] Volume persistente para dados do Postgres em `/var/lib/postgresql/data`
- [ ] Container NestJS escutando na porta `3000`, mapeado para a porta `80` da VM
- [ ] GitHub Actions com pipeline estrita à `main` para build/deploy
- [ ] Secrets sensíveis (`TMDB_API_TOKEN`, `JWT_SECRET`, `DATABASE_URL`, credenciais Azure/SSH) fora do repositório, configurados em GitHub Secrets/ambiente da VM
- [ ] ~~README do back documenta o passo a passo de deploy e variáveis necessárias~~ — desmembrado para o card dedicado `#19` / `ISSUE-BACK-15` (deploy + variáveis do configService), conforme discussão no PR #16
- [ ] PRs que tocam Bicep, `docker-compose.yml` ou GitHub Actions exigem aprovação de pelo menos 2 integrantes antes de merge em `main`
- [ ] PR aberto como `feat/infra-cicd`, ou issue atualizada com link para o PR equivalente caso o nome mude

## ISSUE-BACK-01 — [config] Bootstrap JwtModule + JWT_SECRET no .env

**Labels:** `sprint-1` `back` `epic:infra`
**US:** US-1.2 (PRD §6)
**Depende de:** — (pode rodar Dia 2)

### Contexto

Sprint 0 entregou o scaffold do Nest + Prisma. Falta configurar o `@nestjs/jwt` e expor o `JwtService` para o módulo `auth/` consumir. Token de 24h, secret em variável de ambiente. Decisão registrada no PRD §15 (2026-05-24).

### Critérios de aceite

- [ ] `@nestjs/jwt` e `passport-jwt` instalados
- [ ] `JwtModule.registerAsync({ ... })` configurado no `AuthModule` (criar o módulo se ainda não existir)
- [ ] `secret` lê de `process.env.JWT_SECRET` via `@nestjs/config` (sem hardcode, sem fallback inseguro)
- [ ] `signOptions.expiresIn` = `'24h'` (decisão PRD §15)
- [ ] `.env.example` atualizado com `JWT_SECRET=trocar-em-producao` (e instruções no README do back para gerar um secret real)
- [ ] App sobe sem warn se `JWT_SECRET` estiver presente; falha rápida com mensagem clara se ausente

---

## ISSUE-BACK-02 — [config] @nestjs/throttler global + rate limit no /auth/login

**Labels:** `sprint-1` `back` `epic:infra`
**US:** US-1.2 (PRD §6)
**Depende de:** —

### Contexto

PRD §8 e §6 (US-1.2) exigem rate limit de 5 tentativas a cada 15 minutos por IP no login. Implementar via `@nestjs/throttler` global, com override no endpoint de login. Mensagem genérica no 429 (sem detalhar tempo restante — não vaza info).

### Critérios de aceite

- [ ] `@nestjs/throttler` instalado
- [ ] `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])` global no `AppModule` (default permissivo para outros endpoints)
- [ ] `ThrottlerGuard` registrado globalmente via `APP_GUARD`
- [ ] Decorator `@Throttle({ default: { ttl: 900_000, limit: 5 } })` aplicado **apenas** no handler `POST /auth/login`
- [ ] Resposta 429 retorna `{ "message": "Muitas tentativas, aguarde alguns minutos." }`
- [ ] README do back documenta a regra (5 / 15min por IP) numa linha

---

## ISSUE-BACK-03 — [config] nestjs-pino + exception filter global para 5xx

**Labels:** `sprint-1` `back` `epic:infra`
**US:** — (RNF — PRD §8)
**Depende de:** —

### Contexto

PRD §8 fechou em `nestjs-pino` com setup mínimo: `LoggerModule.forRoot()` com defaults, sem `pino-pretty` em prod, sem `redact` paths configurado. Logger precisa estar pronto antes dos endpoints de auth/titles para que rate-limit-hit, senha-errada e erros 5xx da TMDB já saiam estruturados desde o Dia 1. Exception filter global para garantir que 5xx não vazem stack na resposta e sempre passem pelo logger.

### Critérios de aceite

- [ ] `nestjs-pino` + `pino-http` instalados
- [ ] `LoggerModule.forRoot({ pinoHttp: { transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined } })` no `AppModule`
- [ ] `app.useLogger(app.get(Logger))` no `main.ts`
- [ ] Exception filter global (`AllExceptionsFilter`) captura erros não-tratados, loga via Pino com `level: 'error'` e responde `{ message: 'Erro interno.' }` com status 500
- [ ] Verificado manualmente: subir o app em `NODE_ENV=development` mostra logs legíveis; sem `NODE_ENV` definido, logs saem JSON puro
- [ ] **Nenhum log de senha, token JWT ou body de `/auth/*`** — checagem visual no PR (regra dura PRD §8)

---

## ISSUE-BACK-04 — [config] @nestjs/cache-manager + bootstrap do módulo titles

**Labels:** `sprint-1` `back` `epic:infra`
**US:** US-2.1 (PRD §6)
**Depende de:** —

### Contexto

PRD §8 fechou cache em memória do processo Nest (sem Redis no MVP). Sprint 1 usa só o TTL de busca (1h); demais TTLs (gêneros, ficha, provedores) entram na Sprint 2/3. Esta issue prepara o módulo e a infra de cache para o endpoint `/titles/search`.

### Critérios de aceite

- [ ] `@nestjs/cache-manager` + `cache-manager` instalados
- [ ] `CacheModule.register({ isGlobal: true, ttl: 3_600_000 })` no `AppModule` (default 1h em ms; endpoints com TTL diferente sobrescrevem localmente)
- [ ] Módulo `titles/` criado vazio (controller + service esqueleto) pronto para receber a issue BACK-11
- [ ] `TitlesModule` importa `HttpModule` (deixa pronto para o cliente TMDB da BACK-10)

---

## ISSUE-BACK-05 — [migration] Prisma — adicionar `name` no User + garantir email unique

**Labels:** `sprint-1` `back` `epic:auth`
**US:** US-1.1 (PRD §6)
**Depende de:** —

### Contexto

PRD §11 diz que o User tem `email @unique` e `passwordHash`. US-1.1 adiciona o campo `name` (string 2-60, sem unicidade, trim no DTO). Esta migration consolida o schema antes do endpoint de cadastro.

### Critérios de aceite

- [ ] `schema.prisma` tem o modelo `User` com: `id Int @id @default(autoincrement())`, `email String @unique`, `passwordHash String`, `name String`, `createdAt DateTime @default(now())`
- [ ] `npx prisma migrate dev --name add_user_name` executado e commitado (`prisma/migrations/...`)
- [ ] `prisma generate` rodado; client atualizado
- [ ] README do back documenta como rodar `prisma migrate dev` no setup local

---

## ISSUE-BACK-06 — [auth] Endpoint POST /auth/register

**Labels:** `sprint-1` `back` `epic:auth`
**US:** US-1.1 (PRD §6)
**Depende de:** ISSUE-BACK-05 (migration)

### Contexto

Cria conta nova. Hash em argon2 ou bcrypt (escolha do dev — ambos aceitos pelo PRD §8). Email único; tentativa duplicada retorna 409. Validação de nome, email e senha via DTO com `class-validator`.

### Contrato

`POST /auth/register`

```json
// Request
{ "name": "Caio Planinschek", "email": "caio@exemplo.com", "password": "senha-de-8+" }

// Response 201
{ "id": 1, "name": "Caio Planinschek", "email": "caio@exemplo.com" }
```

| Código | Quando |
|---|---|
| `400` | Validação: name fora de 2-60 / email não bate regex / senha < 8 |
| `409` | Email já cadastrado |

### Critérios de aceite

- [ ] DTO `RegisterDto` com `@IsString @Length(2, 60)` em `name` (com `@Transform` para trim) e regex permitindo letras com acento, números, espaço, hífen e apóstrofe (PRD §15 decisão sobre nome)
- [ ] DTO valida email com `@IsEmail()` (regex simples do `class-validator`; **sem** MX lookup — PRD §15)
- [ ] DTO valida `@MinLength(8)` em `password`; **sem** complexidade obrigatória (PRD §6 — alinha NIST SP 800-63B)
- [ ] `AuthService.register` faz hash com bcrypt (`saltRounds >= 10`) **ou** argon2 (defaults da lib)
- [ ] Persiste via `prisma.user.create({ data: { name, email, passwordHash } })`
- [ ] Retorna 201 com `{ id, name, email }` — **nunca** o hash, nunca a senha
- [ ] Em `P2002` do Prisma (unique violation no email) retorna 409 com `{ "message": "Este email já está cadastrado." }`
- [ ] Endpoint **não** retorna JWT no cadastro (login é separado — sprint-1-plan)
- [ ] **Nunca loga senha** nem body completo da request (PRD §8 — regra dura)

---

## ISSUE-BACK-07 — [auth] Endpoint POST /auth/login (emite JWT)

**Labels:** `sprint-1` `back` `epic:auth`
**US:** US-1.2 (PRD §6)
**Depende de:** ISSUE-BACK-01 (JwtModule), ISSUE-BACK-02 (Throttler), ISSUE-BACK-05 (migration), ISSUE-BACK-06 (idealmente — compartilha `AuthService`)

### Contexto

Login local. Compara senha com hash via `bcrypt.compare` / `argon2.verify`. Em sucesso, assina JWT de 24h com payload mínimo (`sub: userId, email`). Mensagem genérica em 401 para não revelar se email existe (PRD §6 + cenário obrigatório de teste em §8).

### Contrato

`POST /auth/login`

```json
// Request
{ "email": "caio@exemplo.com", "password": "senha-de-8+" }

// Response 200
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": { "id": 1, "name": "Caio Planinschek", "email": "caio@exemplo.com" }
}
```

| Código | Quando |
|---|---|
| `401` | Email não existe **ou** senha errada (mensagem genérica) |
| `429` | Rate limit de 5/15min por IP estourou |

### Critérios de aceite

- [ ] DTO `LoginDto` com `@IsEmail()` em `email` e `@IsString @MinLength(1)` em `password`
- [ ] `AuthService.login(email, password)` busca user por email; se ausente, lança `UnauthorizedException('Email ou senha inválidos.')`
- [ ] Se user existe, compara senha; em falha lança o **mesmo** `UnauthorizedException` (mesma mensagem — PRD §6 + teste §8)
- [ ] Em sucesso, `jwtService.sign({ sub: user.id, email: user.email })` com `expiresIn: '24h'`
- [ ] Retorna 200 com `{ access_token, user: { id, name, email } }` — **nunca** o hash
- [ ] Decorator `@Throttle({ default: { ttl: 900_000, limit: 5 } })` aplicado no handler (vem da BACK-02)
- [ ] Tentativa de login com senha errada loga em `level: 'warn'` apenas `{ context: 'auth', event: 'login_failed', email: '<email>' }` — **nunca a senha**
- [ ] Rate limit estourado loga em `level: 'warn'` apenas `{ context: 'auth', event: 'rate_limited', ip: '<ip>' }`

---

## ISSUE-BACK-08 — [auth] Logout — documentar contrato no README (sem endpoint server-side)

**Labels:** `sprint-1` `back` `epic:auth`
**US:** US-1.3 (PRD §6)
**Depende de:** —

### Contexto

Decisão PRD §15 (2026-05-24): logout no MVP é **só client-side**; o front descarta o token. **Não há endpoint** `POST /auth/logout` no back. Blocklist de tokens revogados foi para §5.3 (stretch). Esta issue existe para registrar a decisão no README do back e evitar que alguém implemente um endpoint achando que faltou.

### Critérios de aceite

- [ ] README do back tem uma seção curta `## Logout` explicando: "Logout é client-side no MVP. O front descarta o token; o back não mantém blocklist. Token continua válido até expirar em 24h. Blocklist de tokens revogados está mapeada como stretch — ver PRD §5.3."
- [ ] **Nenhum** endpoint `/auth/logout` implementado
- [ ] Issue fechada com link para PRD §15 (decisão)

---

## ISSUE-BACK-09 — [titles] TMDB client base (HttpModule + API key + headers v4)

**Labels:** `sprint-1` `back` `epic:catalogo`
**US:** US-2.1 (PRD §6)
**Depende de:** ISSUE-BACK-04 (cache module + módulo titles)

### Contexto

Cliente HTTP reutilizável para chamar a TMDB. Sprint 1 usa só `/search/multi`; Sprint 2 vai reusar para `/movie/{id}`, `/tv/{id}` e `/watch/providers`. Acoplar autenticação (Bearer token v4 da TMDB) e base URL aqui evita duplicação. Spike de validação já registrada em `[[TMDB API — spike de validação]]` (vault).

### Critérios de aceite

- [ ] `TMDB_API_TOKEN` adicionado ao `.env.example` (token v4 — Bearer; mais simples que `api_key` em query)
- [ ] `TmdbHttpService` exporta wrapper sobre `HttpService` que injeta automaticamente:
  - `Authorization: Bearer ${TMDB_API_TOKEN}`
  - `Accept: application/json`
  - `language=pt-BR` e `region=BR` como query params default
- [ ] Base URL `https://api.themoviedb.org/3` em constante
- [ ] App falha rápido no boot se `TMDB_API_TOKEN` estiver ausente
- [ ] **Não** chama TMDB no boot (sem health-check síncrono — atrasaria cold start)

---

## ISSUE-BACK-10 — [titles] Endpoint GET /titles/search (mix filme + série, cache 1h, "carregar mais")

**Labels:** `sprint-1` `back` `epic:catalogo`
**US:** US-2.1 (PRD §6)
**Depende de:** ISSUE-BACK-09 (TMDB client)

### Contexto

Busca via TMDB `/search/multi`, filtra fora resultados de pessoa (PRD §6 US-2.1), normaliza payload para o contrato abaixo. Cache em memória de 1h por chave `(query, page)`. Paginação por "Carregar mais" — front incrementa `page`.

### Contrato

`GET /titles/search?q=<query>&page=<n>`

```json
// Response 200
{
  "results": [
    {
      "tmdbId": 872585,
      "tmdbType": "MOVIE",
      "title": "Oppenheimer",
      "year": 2023,
      "posterUrl": "https://image.tmdb.org/t/p/w500/...jpg",
      "badge": "Filme"
    },
    {
      "tmdbId": 1396,
      "tmdbType": "TV",
      "title": "Breaking Bad",
      "year": 2008,
      "posterUrl": "https://image.tmdb.org/t/p/w500/...jpg",
      "badge": "Série"
    }
  ],
  "page": 1,
  "totalPages": 5,
  "hasMore": true
}
```

| Código | Quando |
|---|---|
| `400` | `q` ausente, vazio ou < 1 caractere; `page` < 1 ou não-inteiro |
| `502` | TMDB indisponível ou retornou erro (timeout, 5xx) |

### Critérios de aceite

- [ ] DTO de query: `@IsString @MinLength(1)` em `q`, `@IsInt @Min(1) @Type(() => Number)` em `page` (default 1)
- [ ] `TitlesService.search(q, page)` chama TMDB `/search/multi?query=${q}&page=${page}`
- [ ] Filtra `media_type === 'person'` antes de mapear
- [ ] Para cada resultado mapeia:
  - `tmdbId` ← `id`
  - `tmdbType` ← `media_type === 'movie' ? 'MOVIE' : 'TV'` (enum do schema — PRD §11)
  - `title` ← `title` (filme) ou `name` (série)
  - `year` ← ano de `release_date` (filme) ou `first_air_date` (série); `null` se ausente
  - `posterUrl` ← `https://image.tmdb.org/t/p/w500${poster_path}`; `null` se `poster_path` ausente
  - `badge` ← `'Filme'` ou `'Série'`
- [ ] `hasMore = page < totalPages`
- [ ] Cache de 1h via `CacheInterceptor` ou `cacheManager.wrap` com chave `search:${q}:${page}`
- [ ] Erro de rede / 5xx da TMDB → captura, loga em `level: 'error'` com `{ context: 'tmdb', event: 'search_failed', err }` e retorna 502 com `{ "message": "Não foi possível buscar agora. Tente novamente." }`
- [ ] **Não** crasha o processo em erro da TMDB

---

## ISSUE-BACK-11 — [test] auth.service — 6 cenários obrigatórios do PRD §8

**Labels:** `sprint-1` `back` `epic:testes`
**US:** US-1.1, US-1.2 (PRD §6)
**Depende de:** ISSUE-BACK-06, ISSUE-BACK-07

### Contexto

PRD §8 lista os 6 cenários obrigatórios de `auth.service` que precisam existir como teste no Jest. Cobertura forçada em % foi rejeitada (PRD §15 — decisão sobre testes). Esta issue é auditável por linha de teste, não por número. CI bloqueia merge se algum falhar (PRD §8).

### Critérios de aceite

Cada item abaixo deve ter teste correspondente em `auth.service.spec.ts` (ou arquivo equivalente):

- [ ] **Cadastro com sucesso** → retorna `{ id, name, email }` sem hash; user persistido no banco (in-memory ou test container — escolha do dev)
- [ ] **Cadastro com email duplicado** → lança erro 409 (ou erro tratado pelo controller como 409)
- [ ] **Login com sucesso** → retorna JWT válido (decodificar e checar `sub === user.id`, `exp` em ~24h)
- [ ] **Login com senha errada** → lança `UnauthorizedException` com mensagem genérica
- [ ] **Login com email inexistente** → lança `UnauthorizedException` com a **mesma** mensagem do cenário acima (não revela que email não existe — PRD §6)
- [ ] **Rate limit dispara após 5 tentativas em 15min** → 6ª requisição retorna 429 (teste de integração com `ThrottlerGuard` real; se for muito custoso, mockar o guard e testar que o decorator `@Throttle` foi aplicado com `limit: 5, ttl: 900_000`)
- [ ] Todos os testes rodam em CI (`npm test`) sem dependência de rede externa
- [ ] **Nenhum teste** loga ou imprime senhas/tokens reais

---

## ISSUE-BACK-12 — [test] titles.service — 3 cenários do PRD §8

**Labels:** `sprint-1` `back` `epic:testes`
**US:** US-2.1 (PRD §6)
**Depende de:** ISSUE-BACK-10

### Contexto

PRD §8 lista 3 cenários obrigatórios de `titles.service`: search OK, cache hit não chama TMDB de novo, erro de rede tratado sem crash.

### Critérios de aceite

Cada item em `titles.service.spec.ts`:

- [ ] **Search com sucesso** → retorna lista com `tmdbId`, `tmdbType`, `title`, `year`, `posterUrl`, `badge` corretos; pessoas filtradas fora; mock da TMDB devolve payload realista de `/search/multi`
- [ ] **Cache hit** → 2ª chamada com `(q, page)` idêntico **não** chama o `TmdbHttpService` (spy/mock zera chamadas na 2ª iteração); resposta vem do cache
- [ ] **Erro de rede / 5xx da TMDB** → `TitlesService.search` captura, **não** propaga crash; controller responde 502 (testar via teste de e2e curto ou via controller spec)
- [ ] Roda em CI sem dependência de rede externa (TMDB sempre mockada)

---

## ISSUE-BACK-13 — [meta] Kickoff Dia 1 — fechar contratos em `docs/contratos-api-s1.md`

**Labels:** `sprint-1` `back` `epic:meta`
**US:** — (PRD §14 — mitigação de risco "front bloqueado")
**Depende de:** —

### Contexto

PRD §14 e sprint-1-plan §"Ordem sugerida" dia 1: call de 30min com back + front + PO para fechar os contratos das 3 APIs por escrito. Sem isso, o front fica bloqueado e a sprint inteira desliza. Contratos rascunhados no `sprint-1-plan.md` valem como ponto de partida; qualquer mudança vai pro arquivo dedicado com data e motivo.

Artefato esperado: `docs/contratos-api-s1.md` (na raiz do repo back, versionado). Front lê via raw URL do GitHub ou clonando.

### Critérios de aceite

- [ ] Call de 30min agendada com back (4), front (4) e PO; QA convidada como ouvinte
- [ ] Arquivo `docs/contratos-api-s1.md` (no repo `lab-dev-software-back`, commitado) contendo, para **cada** dos 3 endpoints (`/auth/register`, `/auth/login`, `/titles/search`):
  - Path + método + headers obrigatórios
  - Schema da request (campos + tipos + validações)
  - Schema da response 2xx
  - Códigos de erro com payload de cada um
  - Exemplo concreto (request + response) — copiar do sprint-1-plan se nada mudou
- [ ] Cabeçalho do arquivo lista quem participou e data
- [ ] Mudanças posteriores vão num "Changelog" no final do arquivo com `YYYY-MM-DD — motivo — assinatura`

---

## ISSUE-BACK-14 — [meta] Atualizar `.env.example` consolidado da Sprint 1

**Labels:** `sprint-1` `back` `epic:meta`
**US:** —
**Depende de:** ISSUE-BACK-01, ISSUE-BACK-09

### Contexto

`.env.example` cresce em paralelo nas issues de config (JWT, TMDB, etc.). Esta issue garante que ao final da Sprint 1 ele esteja consolidado, com comentários curtos por variável, para que QA e qualquer dev novo consigam subir o ambiente local em ≤ 5min.

### Critérios de aceite

- [ ] `.env.example` na raiz do repo back contém **todas** as variáveis usadas na Sprint 1:
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/guia_streaming`
  - `JWT_SECRET=trocar-em-producao-use-openssl-rand-base64-32`
  - `TMDB_API_TOKEN=ver-https://developer.themoviedb.org/reference/intro/authentication`
  - `NODE_ENV=development`
  - `PORT=3001` (se diferente do default)
- [ ] Comentário acima de cada variável (uma linha) explicando o que é
- [ ] README do back tem seção "## Setup local" linkando para `.env.example` com 3 comandos: copiar, preencher, `npx prisma migrate dev`
- [ ] Testado: dev novo clona o repo, segue o README, sobe o app sem perguntar nada no chat

---

## ISSUE-BACK-15 — [infra] README do back: deploy + variáveis de ambiente (configService)

**Labels:** `sprint-1` `back` `epic:infra`
**Publicada como:** `#19` — <https://github.com/luizpassaroni/lab-dev-software-back/issues/19>
**US:** — (RNF / Deploy — PRD §8)
**Depende de:** ISSUE-BACK-00 (#18 — infra base) · distribuir junto com ISSUE-BACK-14 (`.env.example`)

### Contexto

Critério desmembrado da ISSUE-BACK-00 (#18): o README do back precisa documentar o passo a passo de deploy e as variáveis de ambiente consumidas pelo `ConfigService` em produção. Conforme PRD §8, essa documentação é atualizada conforme o pipeline de deploy estabiliza — por isso roda como card próprio, sem bloquear o fechamento da #18. Distribuição combinada junto com a ISSUE-BACK-14 (`.env.example`). Origem: discussão no PR #16 (Eduardo sugeriu "card exclusivo" para README de deploy + variáveis do configService).

### Critérios de aceite

- [ ] Seção `## Deploy` no README do back com o passo a passo de subida na Azure VM (provisionamento via Bicep + pipeline GitHub Actions disparado ao mergear em `main`)
- [ ] Lista das variáveis de ambiente lidas pelo `ConfigService` em produção, com descrição de uma linha cada (`DATABASE_URL`, `JWT_SECRET`, `TMDB_API_TOKEN`, `NODE_ENV`, etc.)
- [ ] Indicação de quais variáveis moram em GitHub Secrets / ambiente da VM e quais ficam no `.env` local — só nomes e propósito, **sem valores reais**
- [ ] Coerência com o `docker-compose.prod.yml` versionado (PR #16) e com o `.env.example` da ISSUE-BACK-14
- [ ] Nenhuma credencial ou segredo real versionado no README
