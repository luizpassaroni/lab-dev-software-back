# Guia de Streaming API

Backend NestJS do Guia de Streaming. A API centraliza autenticacao, dados do usuario e integracao com a TMDB. O browser deve chamar o BFF do frontend; o Next chama esta API server-to-server usando `X-Internal-Key`.

## Setup local

Instale as dependencias:

```bash
npm install
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell, o equivalente e:

```powershell
Copy-Item .env.example .env
```

Preencha as variaveis em `.env`:

| Variavel | Uso local |
| --- | --- |
| `DATABASE_URL` | URL do PostgreSQL usado pelo Prisma. O compose local usa `postgresql://local_user:local_password_123@localhost:5432/uva_local_db` no host. |
| `JWT_SECRET` | Segredo para assinar JWT. Gere um valor proprio para ambientes compartilhados. |
| `TMDB_API_TOKEN` | Token Bearer v4 da TMDB. |
| `INTERNAL_API_KEY` | Chave compartilhada com o BFF do frontend. O mesmo valor deve estar no `.env.local` do front. |
| `NODE_ENV` | Use `development` localmente. |
| `SWAGGER_ENABLED` | Use `true` para habilitar `/api/docs` fora de producao. |
| `PORT` | Porta da API. O default local e `3000`, seguindo `docker-compose.local.yml`. |

Gere segredos locais quando precisar:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### PostgreSQL via Docker e API nativa

O `docker-compose.local.yml` e a referencia do setup local Docker. Ele define:

| Servico | Host/porta | Usuario | Banco |
| --- | --- | --- | --- |
| `postgres_local` | `localhost:5432` | `local_user` | `uva_local_db` |
| `api_local` | `localhost:3000` | - | - |

Para subir apenas o banco:

```bash
docker compose -f docker-compose.local.yml up -d postgres_local
```

Aplique as migrations:

```bash
npx prisma migrate dev
```

Suba a API em modo desenvolvimento:

```bash
npm run start:dev
```

Com esse caminho, a API fica em:

```text
http://localhost:3000
```

Se o frontend Next tambem estiver rodando localmente, configure o front para chamar:

```env
API_INTERNAL_URL=http://localhost:3000
INTERNAL_API_KEY=<mesmo valor do back>
```

Caso o Next precise usar a mesma maquina ao mesmo tempo, mantenha o backend conforme o compose (`localhost:3000`) e suba o frontend em outra porta livre.

### Stack local via Docker

Para subir os servicos definidos no compose local:

```bash
docker compose -f docker-compose.local.yml up --build
```

O container da API escuta `3000` e publica `localhost:3000`, conforme o compose local.

## API Documentation

Com `SWAGGER_ENABLED=true` e fora de producao, a documentacao interativa fica em:

```text
http://localhost:3000/api/docs
```

O Swagger suporta JWT Bearer e o header `X-Internal-Key` usado pelo BFF.

## Logout

Logout e tratado no BFF: o Next apaga o cookie `session`. O Nest nao tem endpoint de logout nem blocklist. O token segue valido ate expirar em 24h. A blocklist de tokens revogados e stretch; consulte o [PRD section 5.3](docs/PRD.md#53-pode-entrar-se-sobrar-tempo-stretch) e as [decisoes registradas no PRD section 15](docs/PRD.md#15-decisões-registradas).

## Scripts

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod

# debug mode
npm run start:debug

# build
npm run build
# Plot Twist — Guia de Streaming (back + front)

> **README de entrada do projeto — "do zero por terceiro" (issue #80 / META-4).**
> Este arquivo mora no repo do back e documenta o setup completo dos **dois**
> repositórios: o **backend** (`lab-dev-software-back`, este repo) e o
> **frontend/BFF** (`lab-dev-software-front`). Seguindo-o num ambiente limpo,
> cada app sobe sem passos faltando.

O **Plot Twist** é um guia de streaming: o usuário busca um filme ou série e
descobre **onde assistir no Brasil**, com sinopse, elenco, nota da TMDB e os
provedores disponíveis. Usuários autenticados podem **avaliar (1–10)**, marcar
como **visto** e **favoritar** títulos.

Arquitetura **BFF**: o navegador fala **só** com o Next (front, same-origin
`/api/*`); o Next fala com esta API Nest server-to-server, injetando a chave
interna. Ver `docs/PRD.md` (§8.1), `CONTEXT.md` e `docs/sprint-1-plan.md`.

```
[Navegador] ──same-origin──▶ [Next.js / BFF (Vercel)] ──server-to-server──▶ [Nest API (Azure VM)] ──▶ [TMDB]
   cookie `session` HttpOnly        X-Internal-Key + Bearer (protegidas)         Postgres
```

| Repositório | Papel | Stack | No ar |
|---|---|---|---|
| [`lab-dev-software-back`](https://github.com/luizpassaroni/lab-dev-software-back) (este repo) | API + alvo do BFF | NestJS 11 · Prisma 7 · PostgreSQL 18 | <https://api-uva.eduoncode.com> |
| [`lab-dev-software-front`](https://github.com/luizpassaroni/lab-dev-software-front) | Front-end + BFF | Next.js 16 · React 19 · pnpm | <https://lab-dev-software-front.vercel.app> |

---

# Parte 1 — Backend (`lab-dev-software-back`, este repositório)

Serviço **backend (NestJS)**, atrás do BFF. O navegador nunca chama esta API
diretamente — quem fala com ela é o Next, server-to-server.

## Stack

- **Node.js 20** + **TypeScript 5**
- **NestJS 11**
- **Prisma 7** (ORM) sobre **PostgreSQL 18**
- **JWT** (`@nestjs/jwt` + `passport-jwt`) e **bcrypt** para senha
- **TMDB** (API v4) como fonte do catálogo
- **class-validator** (validação de DTOs e de env), **@nestjs/throttler** (rate limit), **@nestjs/cache-manager** (cache TTL 1h)
- Testes com **Jest**

## Pré-requisitos

Para rodar num ambiente limpo você precisa de **uma** das duas opções abaixo:

**Opção A — local (sem Docker):**
- Node.js **20+** e npm
- Um **PostgreSQL** acessível (local ou remoto)

**Opção B — Docker (recomendado para subir rápido):**
- Docker + Docker Compose (sobe Postgres + API juntos)

Em ambos os casos você precisa de um **token v4 da TMDB**
(<https://www.themoviedb.org/settings/api>) para que a busca/ficha funcionem.

## Setup do zero (local, sem Docker)

```bash
# 1. Clonar e entrar no projeto
git clone https://github.com/luizpassaroni/lab-dev-software-back.git
cd lab-dev-software-back

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
#   edite o .env (ver tabela abaixo). No mínimo:
#   - DATABASE_URL apontando para o seu Postgres
#   - JWT_SECRET e INTERNAL_API_KEY com 16+ caracteres
#   - TMDB_API_TOKEN com o seu token v4
#   Gere segredos seguros com:  openssl rand -base64 32

# 4. Gerar o Prisma Client (OBRIGATÓRIO antes de buildar/testar)
npx prisma generate

# 5. Aplicar as migrations no banco
npx prisma migrate deploy   # ou: npx prisma migrate dev (em desenvolvimento)

# 6. Subir em modo desenvolvimento (watch)
npm run start:dev
```

A API sobe em **http://localhost:3000** (porta configurável via `PORT`).
Verifique com:

```bash
curl http://localhost:3000/health
# -> {"status":"ok"}
```

> ⚠️ **Gate obrigatório — `prisma generate`.** O Prisma Client **não** é gerado
> automaticamente no `npm install` (não há `postinstall`). Rode
> **`npx prisma generate` antes de `npm run build` e antes de `npm test`** —
> sem isso a compilação e os testes falham por falta dos tipos do `@prisma/client`.

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `DATABASE_URL` | sim | — | String de conexão do PostgreSQL (`postgresql://user:pass@host:5432/db`) |
| `JWT_SECRET` | sim | `trocar-em-producao` | Segredo do JWT. **Mín. 16 caracteres** — o app não sobe se for menor. Nunca use o default em produção. |
| `INTERNAL_API_KEY` | sim | `trocar-em-producao` | Segredo compartilhado com o BFF (Next). Vai no header `X-Internal-Key` de toda chamada Next → Nest. **Mín. 16 caracteres.** Use o **mesmo valor** nos dois lados. |
| `TMDB_API_TOKEN` | sim (para titles) | — | Token **v4 (Read Access / Bearer)** da TMDB |
| `NODE_ENV` | não | `development` | Ambiente de execução |
| `PORT` | não | `3000` | Porta do servidor |

As variáveis são validadas no boot (`src/env.validation.ts`): se `JWT_SECRET`
ou `INTERNAL_API_KEY` tiverem menos de 16 caracteres, a aplicação **falha ao
iniciar** com mensagem explícita.

## Comandos

```bash
npm run start:dev     # desenvolvimento (watch)
npm run start         # desenvolvimento (sem watch)
npm run build         # compila para dist/  (rode prisma generate antes)
npm run start:prod    # produção: node dist/src/main
npm run lint          # ESLint --fix
npm run format        # Prettier
```

## Testes

```bash
npx prisma generate   # gate: necessário antes da primeira execução
npm run test          # testes unitários (Jest)
npm run test:watch    # watch
npm run test:cov      # cobertura
npm run test:e2e      # testes end-to-end
```

## Banco de dados (Prisma)

- Schema: `prisma/schema.prisma` — modelos `User`, `Rating`, `Watched`, `Favorite`.
  Títulos não são persistidos localmente: são referenciados por `tmdbId` + `tmdbType` (`MOVIE`/`TV`).
- Migration inicial: `prisma/migrations/20260523123455_init`.

```bash
npx prisma generate            # gera o Prisma Client (gate de build/test)
npx prisma migrate dev         # cria/aplica migration em desenvolvimento
npx prisma migrate deploy      # aplica migrations existentes (produção/CI)
npx prisma studio              # inspeciona o banco no navegador
```

## Rodar com Docker

**Local (Postgres + API, com hot-reload e migrations automáticas):**

```bash
docker compose -f docker-compose.local.yml up --build
```

Sobe um Postgres 18 e a API em `http://localhost:3000`. O container espera o
Postgres ficar pronto, roda `prisma migrate deploy` e inicia em modo watch.

**Produção** (`docker-compose.prod.yml`): usa a imagem publicada
`ghcr.io/luizpassaroni/nestjs-api:latest` atrás de um reverse proxy **Caddy**
(TLS automático nas portas 80/443) + Postgres com volume persistente. Exige as
variáveis `POSTGRES_PASSWORD`, `JWT_SECRET`, `INTERNAL_API_KEY` e
`TMDB_API_TOKEN` no ambiente. A infra (Azure VM, região Brazil South) está
descrita em `infra/main.bicep`; o deploy é automatizado em
`.github/workflows/deploy.yml` (pipeline estrita à `main`).

## Endpoints principais

> **Header obrigatório.** Um guard global (`InternalKeyGuard`) exige o header
> `X-Internal-Key: <INTERNAL_API_KEY>` em **todas** as rotas, exceto as públicas
> (`/health`). Em produção, quem injeta esse header é o BFF (Next) — o navegador
> nunca chama esta API diretamente. Há também rate limit global (100 req/min por IP).

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check (público, sem header) |
| `POST` | `/auth/register` | Cadastro (nome, email, senha) |
| `POST` | `/auth/login` | Login — emite JWT (expira em 24h) |
| `GET` | `/titles/search?q=<termo>&page=<n>` | Busca filmes + séries na TMDB (região BR) |
| `GET` | `/titles/:type/:id` | Ficha do título (`type` = `movie`/`tv`, `id` = id da TMDB) |

Sobre **logout**: não há endpoint server-side — a sessão é descartada no BFF
(remoção do cookie). Ver `CONTEXT.md` e a issue de contrato de logout.

## Estrutura do back

```
src/
├── auth/         # cadastro, login, JWT, guards de autenticação
├── titles/       # busca e ficha de títulos (cliente TMDB + cache)
├── user/         # dados do usuário
├── prisma/       # PrismaModule/Service
├── common/       # guards (InternalKey, throttler), decorators (@Public)
├── env.validation.ts
└── main.ts
prisma/           # schema + migrations
infra/            # main.bicep (Azure)
docs/             # PRD, contratos de API, planos de sprint, issues
```

---

# Parte 2 — Frontend (`lab-dev-software-front`)

## Tests

```bash
# unit tests
npm run test

# watch mode
npm run test:watch

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

## Deploy

O deploy de producao roda na Azure VM com Docker compose e e disparado pelo GitHub Actions em pushes para `main` que alterem arquivos de infra, Docker, Prisma, package ou codigo fonte.

Fluxo de producao:

1. O workflow provisiona/atualiza a infraestrutura via Bicep.
2. A imagem Docker da API e buildada e publicada no GitHub Container Registry.
3. A VM recebe o `docker-compose.prod.yml` e um `.env` gerado pelo workflow.
4. `docker compose up -d --force-recreate` recria os containers.
5. O workflow executa `npx prisma migrate deploy` dentro do container da API.

### HTTPS

A API publica o dominio `api-uva.eduoncode.com` por meio do Caddy definido no `docker-compose.prod.yml`. O registro DNS A aponta para o IP publico estatico da VM. O Caddy:

- encaminha as requisicoes para o servico `api:3000`;
- emite e renova automaticamente o certificado TLS pela Let's Encrypt;
- redireciona requisicoes HTTP para HTTPS;
- persiste certificados e configuracao nos volumes `caddy_data` e `caddy_config`.

As portas `80` e `443` precisam permanecer liberadas no NSG. A porta `80` tambem e usada pelo desafio HTTP-01 durante a emissao ou renovacao do certificado.

Verificacao publica:

```bash
# Deve responder 200 sem usar -k.
curl -I https://api-uva.eduoncode.com/health

# Deve redirecionar para HTTPS.
curl -I http://api-uva.eduoncode.com/health
```

### Checklist pos-deploy

Na VM, em `~/app`, valide os containers e as migrations:

```bash
docker compose ps
docker compose exec -T api npx prisma migrate status
```

Para confirmar as variaveis obrigatorias sem imprimir os valores:

```bash
docker compose exec -T api sh -lc '
for name in DATABASE_URL JWT_SECRET INTERNAL_API_KEY TMDB_API_TOKEN; do
  eval value=\$$name
  if [ -n "$value" ]; then
    echo "$name=present"
  else
    echo "$name=missing"
  fi
done'
```

Depois de cada gate `develop` para `main`, o pipeline deve ficar verde e o fluxo publicado deve validar cadastro, login, sessao, busca, ficha e os recursos de historico disponiveis. O custo do resource group `rg-faculdade-prod` deve ser acompanhado no Azure Cost Management durante a sprint.

Variaveis e secrets de producao:

| Nome | Origem em producao | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Montada no `docker-compose.prod.yml` a partir do servico Postgres interno. | Conexao do Prisma com o PostgreSQL. |
| `JWT_SECRET` | GitHub Secret `PROD_JWT_SECRET`, escrito no `.env` da VM pelo workflow. | Assinatura e validacao dos JWTs. |
| `TMDB_API_TOKEN` | GitHub Secret `PROD_TMDB_API_TOKEN`, escrito no `.env` da VM pelo workflow. | Token Bearer v4 para chamadas TMDB. |
| `INTERNAL_API_KEY` | GitHub Secret `PROD_INTERNAL_API_KEY`, escrito no `.env` da VM pelo workflow. | Chave compartilhada com o BFF do frontend. |
| `NODE_ENV` | Definido como `production` na imagem Docker. | Modo de execucao da aplicacao. |
| `PORT` | `.env` da VM e `docker-compose.prod.yml`. | Porta interna da API; default `3000`. |
| `POSTGRES_PASSWORD` | GitHub Secret `PROD_POSTGRES_PASSWORD`, escrito no `.env` da VM pelo workflow. | Senha do banco PostgreSQL de producao. |

Valores reais de secrets nunca devem ser versionados.
Front-end **e BFF** do Plot Twist. O navegador fala **só** com o Next
(same-origin, `/api/*`); o Next fala com a API Nest (Parte 1) server-to-server,
injetando a chave interna. O token de sessão vive num cookie `HttpOnly` — o JS
do browser nunca o lê.

## Stack

- **Node.js 20** + **TypeScript 5**
- **Next.js 16** (App Router, React Compiler) + **React 19**
- **pnpm 10** (gerenciador de pacotes)
- **Tailwind CSS 4** + **Radix UI** (componentes estilo shadcn/ui)
- **TanStack Query** (data fetching) + **TanStack Form** & **Zod** (validação)
- **Biome** (lint + format) e **Vitest** + Testing Library (testes)

## Pré-requisitos

- **Node.js 20+** (o CI roda em Node 20)
- **pnpm 10+** — instale com `npm i -g pnpm@10` ou `corepack enable`

## Setup do zero

```bash
# 1. Clonar e entrar no projeto
git clone https://github.com/luizpassaroni/lab-dev-software-front.git
cd lab-dev-software-front

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.local.example .env.local
#   Para usar a API real, preencha API_INTERNAL_URL e INTERNAL_API_KEY.
#   Sem elas, o BFF responde com mocks de dev (dá pra rodar o front isolado).

# 4. Subir em modo desenvolvimento
pnpm dev
```

A aplicação sobe em **http://localhost:3001**.

> 💡 **Funciona sem backend.** Enquanto `API_INTERNAL_URL` não estiver definida,
> os route handlers `/api/*` respondem com **mocks de dev** que seguem o mesmo
> contrato da API — útil para desenvolver o front isolado.

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local`. As variáveis do BFF são
**server-only** (sem prefixo `NEXT_PUBLIC_`), então o segredo nunca chega ao
browser:

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `API_INTERNAL_URL` | para API real | — (mock) | URL interna da API Nest, usada **só server-side** pelos route handlers `/api/*`. Local: `http://localhost:3000`. Ausente → BFF usa mocks de dev. |
| `INTERNAL_API_KEY` | para API real | — | Segredo compartilhado com o back; vai no header `X-Internal-Key` em toda chamada Next → Nest. **Use o mesmo valor dos dois lados.** |

## Comandos

```bash
pnpm dev        # desenvolvimento — http://localhost:3001
pnpm build      # build de produção
pnpm start      # serve o build de produção
pnpm test       # testes (Vitest, run único)
pnpm lint       # Biome (checagem)
pnpm format     # Biome (corrige)
```

No MVP o front tem apenas **testes simbólicos** (2-3 testes de componente),
conforme PRD §8.3. No CI (`.github/workflows/ci.yml`), `pnpm lint`, `pnpm test`
e `pnpm build` rodam a cada PR.

## Camada de dados (BFF)

Cada chamada do browser passa por um route handler `/api/*` (`src/app/api/...`),
que lê o cookie `session`, injeta os headers internos (`X-Internal-Key`,
`Authorization: Bearer`, `X-Client-IP`) e chama o Nest. Enquanto o backend não
está configurado (`API_INTERNAL_URL` ausente), os handlers caem em **mocks de
dev** com o mesmo contrato — trocar para o backend real é só preencher o
`.env.local`, sem mudar código. Exemplo:
`src/modules/auth/queries/register.ts`.

## Estrutura do front

```
src/
├── app/                 # App Router (rotas + BFF)
│   ├── (auth)/          # login e cadastro
│   ├── api/             # route handlers /api/* (BFF → Nest)
│   ├── busca/           # resultados de busca
│   ├── titulo/          # ficha do título
│   ├── perfil/          # perfil do usuário
│   ├── layout.tsx       # layout global (header, tema)
│   └── page.tsx         # home (hero + busca + chips de gênero)
├── modules/             # lógica por domínio: auth, titles, profile (queries + mocks)
├── shared/              # componentes e utilitários compartilhados
└── test/                # setup de testes
```

---

# Parte 3 — Rodar o stack completo local (back + front)

1. **Suba o back** (Parte 1) na porta `3000` — não esqueça o `npx prisma generate`.
2. No front, no `.env.local`, aponte para o back local e use o **mesmo** segredo:
   ```env
   API_INTERNAL_URL=http://localhost:3000
   INTERNAL_API_KEY=<o mesmo valor do .env do back>
   ```
3. **Suba o front** (`pnpm dev`) na porta `3001` e abra <http://localhost:3001>.

Fluxo de ponta a ponta: criar conta → login → buscar um título → abrir a ficha →
ver "onde assistir" no Brasil.

---

# URL no ar

- **Front (Vercel):** <https://lab-dev-software-front.vercel.app>
- **API (Azure VM + Caddy/HTTPS):** <https://api-uva.eduoncode.com> — `GET /health` responde `{"status":"ok"}`.

# Documentação

Ordem de leitura recomendada do projeto:

1. `docs/PRD.md` — o quê e o porquê
2. `CONTEXT.md` — glossário canônico (vocabulário do time; idêntico nos 2 repos)
3. `docs/sprint-1-plan.md` — o recorte da sprint
4. A issue — a tarefa
