# lab-dev-software-back

Backend do projeto Guia de Streaming — NestJS + Prisma + PostgreSQL.

## Setup local

1. Clone o repositório e instale as dependências:

```bash
npm install
```

2. Configure o arquivo `.env` na raiz com sua string de conexão:
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/guia_streaming?schema=public"

3. Rode as migrations:

```bash
npx prisma migrate dev
```

4. Inicie o servidor:

```bash
npm run start:dev
```