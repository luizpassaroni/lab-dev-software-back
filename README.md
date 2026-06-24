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
```

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
