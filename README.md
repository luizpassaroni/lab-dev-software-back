# Plot Twist — Back

API do **Plot Twist**, um guia de streaming: o usuário busca um filme ou série e
descobre **onde assistir no Brasil**, com sinopse, elenco, nota da TMDB e os
provedores disponíveis. Usuários autenticados podem **avaliar (1–10)**, marcar
como **visto** e **favoritar** títulos.

Este serviço é o **backend (NestJS)**. Ele fica atrás do BFF (o Next, repo
[`lab-dev-software-front`](https://github.com/luizpassaroni/lab-dev-software-front)):
o navegador fala **só** com o Next, e o Next fala com esta API
server-to-server. Ver `docs/PRD.md` (§8.1), `CONTEXT.md` e
`docs/sprint-1-plan.md`.

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
descrita em `infra/main.bicep`.

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

## URL no ar

<!-- TODO(META-4 / #80): preencher com a URL pública da API após o deploy.
     Ex.: https://<dominio-ou-ip>/health  deve responder {"status":"ok"}. -->

- **API:** _a definir_ — `GET /health` deve responder `{"status":"ok"}`.

## Estrutura do projeto

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

## Documentação

Ordem de leitura recomendada do projeto:

1. `docs/PRD.md` — o quê e o porquê
2. `CONTEXT.md` — glossário canônico (vocabulário do time; idêntico nos 2 repos)
3. `docs/sprint-1-plan.md` — o recorte da sprint
4. A issue — a tarefa
