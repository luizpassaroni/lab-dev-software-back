# Referência da API — Guia de Streaming (Plot Twist)

A API REST é servida pelo NestJS em
`https://api-uva.eduoncode.com`. O navegador não chama essa API diretamente:
ele fala com o BFF do Next.js por rotas same-origin em `/api/*`. O BFF injeta
`X-Internal-Key` e, nas rotas autenticadas, encaminha o JWT do cookie de sessão
como `Authorization: Bearer <jwt>`.

## Visão geral

- Todas as rotas de aplicação do NestJS, exceto `GET /health`, exigem o header
  `X-Internal-Key`.
- Rotas protegidas também exigem `Authorization: Bearer <jwt>`.
- O JWT é válido por 24 horas.
- O BFF mantém o JWT no cookie `session`, com `HttpOnly`, `SameSite=Lax`,
  `Path=/`, `Max-Age=86400` e `Secure` em produção.
- O limite global é de 100 requisições por minuto por IP.
- O login tem um limite adicional de 5 tentativas a cada 15 minutos.
- `type` nos parâmetros de rota aceita `movie` ou `tv`.
- `tmdbType` nos corpos de resposta usa `MOVIE` ou `TV`.
- Campos sem informação disponível, como ano, pôster ou duração, podem ser
  `null`.

O BFF encaminha o IP do cliente no header `X-Client-IP` para que o rate-limit
do NestJS não agrupe todos os usuários sob o IP do servidor Next.js.

Quando habilitado por `SWAGGER_ENABLED=true`, o ambiente do NestJS também
oferece documentação interativa em `/api/docs`. Este arquivo é a referência
estática do contrato final da aplicação.

## Formato de erro

Os erros usam um objeto JSON com `message`. Em erros de validação do NestJS,
`message` pode ser uma lista:

```json
{
  "message": ["page must not be less than 1"],
  "error": "Bad Request",
  "statusCode": 400
}
```

O BFF normaliza parte desses erros para uma mensagem única:

```json
{
  "message": "Não autenticado."
}
```

## Resumo das rotas

| Método   | Rota NestJS                  | Espelho BFF             | Acesso                       |
| -------- | ---------------------------- | ----------------------- | ---------------------------- |
| `GET`    | `/health`                    | —                       | Público                      |
| `POST`   | `/auth/register`             | `/api/auth/register`    | Chave interna                |
| `POST`   | `/auth/login`                | `/api/auth/login`       | Chave interna                |
| `GET`    | `/auth/me`                   | `/api/auth/me`          | Chave interna + JWT          |
| —        | —                            | `POST /api/auth/logout` | Sessão no BFF                |
| `GET`    | `/titles/search`             | `/api/titles/search`    | Chave interna                |
| `GET`    | `/titles/discover`           | `/api/titles/discover`  | Chave interna                |
| `GET`    | `/titles/:type/:id`          | `/api/titles/:type/:id` | Chave interna + JWT opcional |
| `GET`    | `/genres`                    | `/api/genres`           | Chave interna                |
| `POST`   | `/titles/:type/:id/rating`   | Mesma rota sob `/api`   | Chave interna + JWT          |
| `DELETE` | `/titles/:type/:id/rating`   | Mesma rota sob `/api`   | Chave interna + JWT          |
| `POST`   | `/titles/:type/:id/watched`  | Mesma rota sob `/api`   | Chave interna + JWT          |
| `DELETE` | `/titles/:type/:id/watched`  | Mesma rota sob `/api`   | Chave interna + JWT          |
| `POST`   | `/titles/:type/:id/favorite` | Mesma rota sob `/api`   | Chave interna + JWT          |
| `DELETE` | `/titles/:type/:id/favorite` | Mesma rota sob `/api`   | Chave interna + JWT          |
| `GET`    | `/users/me/profile`          | `/api/users/me/profile` | Chave interna + JWT          |

## Sistema

### `GET /health`

Verifica se a API está disponível.

- **BFF:** não possui espelho.
- **Autenticação:** pública; não exige `X-Internal-Key` nem JWT.
- **Body:** nenhum.
- **Resposta `200`:**

```json
{
  "status": "ok"
}
```

## Autenticação

### `POST /auth/register`

Cria uma conta. O cadastro não inicia uma sessão.

- **BFF:** `POST /api/auth/register`.
- **Autenticação no NestJS:** `X-Internal-Key`.
- **Body:**

```json
{
  "name": "Test User",
  "email": "user@example.com",
  "password": "password123"
}
```

Regras: `name` deve ter entre 3 e 50 caracteres; `email` deve ser válido;
`password` deve ser uma string com pelo menos 8 caracteres.

- **Resposta `201` do NestJS e do BFF:**

```json
{
  "id": 1,
  "name": "Test User",
  "email": "user@example.com",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

- **Erros:** `400` para dados inválidos; `409` para e-mail já cadastrado.
- **Sessão:** não retorna JWT nem define cookie.

### `POST /auth/login`

Autentica uma conta existente.

- **BFF:** `POST /api/auth/login`.
- **Autenticação no NestJS:** `X-Internal-Key`.
- **Rate-limit:** 5 tentativas a cada 15 minutos por IP.
- **Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Os dois campos são obrigatórios; o cadastro é que impõe o mínimo de 8
caracteres à senha.

- **Resposta `200` do NestJS:**

```json
{
  "access_token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "user@example.com",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

- **Resposta `200` do BFF:**

```json
{
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "user@example.com",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

O BFF remove o `access_token` do corpo enviado ao navegador e o grava no
cookie `session`.

- **Erros:** `400` para body inválido; `401` para credenciais inválidas;
  `429` quando o limite de tentativas é excedido.

### `GET /auth/me`

Retorna o usuário associado ao JWT.

- **BFF:** `GET /api/auth/me`.
- **Autenticação no NestJS:** `X-Internal-Key` + JWT.
- **Body:** nenhum.
- **Resposta `200`:**

```json
{
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "user@example.com",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

- **Erro:** `401` quando a sessão está ausente, inválida ou expirada.

No BFF, o JWT é lido do cookie `session`; o navegador não envia um header
`Authorization` manualmente.

### `POST /api/auth/logout` — somente BFF

Encerra a sessão removendo o cookie `session`.

- **NestJS:** não existe endpoint de logout.
- **Body:** nenhum.
- **Resposta:** `204 No Content`.

## Catálogo

### `GET /titles/search`

Busca filmes e séries por texto.

- **BFF:** `GET /api/titles/search`.
- **Autenticação no NestJS:** `X-Internal-Key`.
- **Query:**
  - `q`: texto obrigatório, sem aceitar apenas espaços;
  - `page`: inteiro maior ou igual a 1; padrão `1`.
- **BFF:** quando `page` não é um número positivo, usa `1`; uma chamada direta
  ao NestJS rejeita o valor inválido com `400`.
- **Exemplo:** `/titles/search?q=Oppenheimer&page=1`.
- **Resposta `200`:**

```json
{
  "results": [
    {
      "tmdbId": 872585,
      "tmdbType": "MOVIE",
      "title": "Oppenheimer",
      "year": 2023,
      "posterUrl": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "badge": "Filme"
    }
  ],
  "page": 1,
  "totalPages": 4,
  "hasMore": true
}
```

- **Erros:** `400` para query inválida; `502` quando a TMDB está indisponível.

### `GET /titles/discover`

Lista títulos populares ou filtra a descoberta por gênero.

- **BFF:** `GET /api/titles/discover`.
- **Autenticação no NestJS:** `X-Internal-Key`.
- **Query:**
  - `genre`: ID inteiro de gênero da TMDB; opcional;
  - `page`: inteiro maior ou igual a 1; padrão `1`.
- **Comportamento:** sem `genre`, retorna títulos populares para a seção
  "Em alta".
- **Resposta `200`:** o mesmo formato de `GET /titles/search`.
- **Erros:** `400` para query inválida; `502` quando a TMDB está indisponível.

### `GET /titles/:type/:id`

Retorna a ficha completa de um filme ou série e os provedores disponíveis no
Brasil.

- **BFF:** `GET /api/titles/:type/:id`.
- **Autenticação no NestJS:** `X-Internal-Key`; JWT opcional.
- **Parâmetros:**
  - `type`: `movie` ou `tv`;
  - `id`: ID inteiro do título na TMDB.
- **Resposta `200`:**

```json
{
  "tmdbId": 872585,
  "tmdbType": "MOVIE",
  "title": "Oppenheimer",
  "year": 2023,
  "overview": "...",
  "posterUrl": "https://image.tmdb.org/t/p/w500/poster.jpg",
  "backdropUrl": "https://image.tmdb.org/t/p/original/backdrop.jpg",
  "runtime": 180,
  "seasons": null,
  "tmdbRating": 8.1,
  "genres": ["Drama", "História"],
  "cast": [
    {
      "name": "Cillian Murphy",
      "character": "J. Robert Oppenheimer",
      "profileUrl": "https://image.tmdb.org/t/p/w185/profile.jpg"
    }
  ],
  "providers": {
    "flatrate": [
      {
        "name": "Netflix",
        "logoUrl": "https://image.tmdb.org/t/p/original/logo.jpg"
      }
    ],
    "rent": [],
    "buy": []
  },
  "userState": {
    "rating": 8,
    "watched": true,
    "favorite": false
  }
}
```

`userState` só é incluído quando há um JWT associado a um usuário. Sem
autenticação, essa propriedade não aparece. O BFF encaminha automaticamente o
JWT do cookie quando existe uma sessão.

- **Erros:** `400` para tipo ou ID inválido; `404` para título não encontrado;
  `502` quando a TMDB está indisponível.

### `GET /genres`

Lista os gêneros combinados de filmes e séries.

- **BFF:** `GET /api/genres`.
- **Autenticação no NestJS:** `X-Internal-Key`.
- **Body:** nenhum.
- **Resposta `200`:**

```json
[
  {
    "id": 28,
    "nome": "Ação"
  }
]
```

- **Erro:** `502` quando a TMDB está indisponível.

## Histórico do usuário

Todas as rotas desta seção exigem `X-Internal-Key` e JWT no NestJS. Nos
espelhos BFF, o navegador usa o cookie `session`; sem sessão, o BFF responde
`401`.

As rotas usam `type = movie | tv` e o ID inteiro do título na TMDB.

### `POST /titles/:type/:id/rating`

Cria ou substitui a avaliação do usuário e garante que o título esteja marcado
como visto.

- **BFF:** mesma rota sob `/api`.
- **Body:**

```json
{
  "score": 8
}
```

`score` deve ser um inteiro de 1 a 10.

- **Resposta `200`:**

```json
{
  "rating": {
    "score": 8
  },
  "watched": {
    "origem": "auto"
  }
}
```

Se o usuário já havia marcado o título manualmente como visto, `origem`
permanece `manual`.

- **Erros:** `400` para parâmetros ou nota inválidos; `401` sem autenticação.

### `DELETE /titles/:type/:id/rating`

Remove a avaliação de forma idempotente.

- **BFF:** mesma rota sob `/api`.
- **Body:** nenhum.
- **Resposta:** `204 No Content`.
- **Regra:** se o visto havia sido criado automaticamente pela avaliação, ele
  também é removido. Um visto de origem `manual` permanece.
- **Erros:** `400` para tipo ou ID inválido; `401` sem autenticação.

### `POST /titles/:type/:id/watched`

Marca o título como visto manualmente. A operação é idempotente e também
promove um visto automático existente para manual.

- **BFF:** mesma rota sob `/api`.
- **Body:** nenhum.
- **Resposta `200`:**

```json
{
  "watched": {
    "origem": "manual"
  }
}
```

- **Erros:** `400` para tipo ou ID inválido; `401` sem autenticação.

### `DELETE /titles/:type/:id/watched`

Remove a marcação de visto de forma idempotente.

- **BFF:** mesma rota sob `/api`.
- **Body:** nenhum.
- **Resposta:** `204 No Content`.
- **Erros:** `400` para tipo ou ID inválido; `401` sem autenticação; `409`
  quando existe uma avaliação ativa.

Para resolver o `409`, remova primeiro a avaliação.

### `POST /titles/:type/:id/favorite`

Marca o título como favorito de forma idempotente.

- **BFF:** mesma rota sob `/api`.
- **Body:** nenhum.
- **Resposta `200`:**

```json
{
  "favorite": true
}
```

- **Erros:** `400` para tipo ou ID inválido; `401` sem autenticação.

### `DELETE /titles/:type/:id/favorite`

Remove o título dos favoritos de forma idempotente.

- **BFF:** mesma rota sob `/api`.
- **Body:** nenhum.
- **Resposta:** `204 No Content`.
- **Erros:** `400` para tipo ou ID inválido; `401` sem autenticação.

### `GET /users/me/profile`

Retorna os totais e as listas recentes do usuário.

- **BFF:** `GET /api/users/me/profile`.
- **Body:** nenhum.
- **Resposta `200`:**

```json
{
  "totais": {
    "vistos": 12,
    "avaliados": 7,
    "favoritos": 5
  },
  "vistos": [
    {
      "tmdbId": 872585,
      "tmdbType": "MOVIE",
      "title": "Oppenheimer",
      "year": 2023,
      "posterUrl": "https://image.tmdb.org/t/p/w500/poster.jpg"
    }
  ],
  "avaliados": [
    {
      "tmdbId": 872585,
      "tmdbType": "MOVIE",
      "title": "Oppenheimer",
      "year": 2023,
      "posterUrl": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "score": 9
    }
  ],
  "favoritos": [
    {
      "tmdbId": 872585,
      "tmdbType": "MOVIE",
      "title": "Oppenheimer",
      "year": 2023,
      "posterUrl": "https://image.tmdb.org/t/p/w500/poster.jpg"
    }
  ]
}
```

Cada lista contém até 30 itens, ordenados dos mais recentes para os mais
antigos.

- **Erro:** `401` sem autenticação.

## Rotas internas fora do contrato funcional

O NestJS ainda contém `GET /`, que retorna uma saudação, e o scaffold
`/user/*` (`GET`, `PATCH` e `DELETE`). Essas rotas não possuem espelho no BFF,
não são usadas pelo produto entregue e não fazem parte da referência funcional
da aplicação.

## Fontes do contrato

Esta referência acompanha os controllers e DTOs em:

- `src/auth/`;
- `src/titles/`;
- `src/history/`;
- `src/common/guards/`;
- os route handlers `src/app/api/` do frontend.
