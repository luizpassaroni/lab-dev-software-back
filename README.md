# lab-dev-software-back

Backend do projeto Guia de Streaming — NestJS + Prisma + PostgreSQL.

## Setup local
## Setup local

1. Clone o repositório e instale as dependências:
```bash
   npm install
```

2. Copie o arquivo de exemplo e preencha com seus valores:
```bash
   cp .env.example .env
```

3. Edite o `.env` com suas credenciais locais (banco, JWT, TMDB, etc).

4. Rode as migrations:
```bash
   npx prisma migrate dev
```

5. Inicie o servidor:
```bash
   npm run start:dev
```