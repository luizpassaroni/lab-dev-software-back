# Contratos API — Sprint 1

**Participantes:** IgorRocha1603, luizpassaroni, caioplaninschek, eduoncode, joaovictorBC  
**Data:** 2026-06-13  

---

## Rotas browser-facing

### 1. POST /api/auth/register

**Hop 1 — Browser → Next**
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "name": "string (3-50 chars)",
  "email": "string",
  "password": "string (mín. 8 caracteres)"
}
```
- Response 201:
```json
{
  "id": "number",
  "name": "string",
  "email": "string",
  "createdAt": "string (ISO 8601)"
}
```

- ⚠️ Cadastro não autentica: nenhum cookie de sessão é setado e o usuário segue para o login.

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`, `Content-Type: application/json`
- Body: mesmo do Hop 1
- Response 201:
```json
{
  "id": "number",
  "name": "string",
  "email": "string",
  "createdAt": "string (ISO 8601)"
}
```
- Erros: `400` campos inválidos, `409` e-mail já cadastrado

---

### 2. POST /api/auth/login

**Hop 1 — Browser → Next**
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "email": "string",
  "password": "string"
}
```
- Response 200:
```json
{
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "createdAt": "string (ISO 8601)"
  }
}
```
- ⚠️ Sessão em cookie HttpOnly setado pelo Next — o `access_token` do Hop 2 não vai no corpo nem fica acessível ao browser.

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`, `Content-Type: application/json`
- Body: mesmo do Hop 1
- Response 200:
```json
{
  "access_token": "string",
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "createdAt": "string (ISO 8601)"
  }
}
```
- Erros: `400` campos inválidos, `401` credenciais incorretas, `429` rate limit

---

### 3. POST /api/auth/logout

**Hop 1 — Browser → Next**
- Headers: nenhum (o cookie `session` HttpOnly é enviado automaticamente pelo browser)
- ⚠️ Logout é 100% no Next: o BFF apaga o cookie `session` (`Set-Cookie: session=; Max-Age=0`). Não há endpoint no Nest, sem chamada server-to-server.
- Response 204 (sem corpo)

---

### 4. GET /api/auth/me

**Hop 1 — Browser → Next**
- Headers: nenhum (o cookie `session` HttpOnly é enviado automaticamente pelo browser)
- Response 200:
```json
{
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "createdAt": "string (ISO 8601)"
  }
}
```

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`, `Authorization: Bearer <token>`
- Response 200:
```json
{
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "createdAt": "string (ISO 8601)"
  }
}
```
- Erros: `401` token inválido/expirado

---

### 5. GET /api/titles/search

**Hop 1 — Browser → Next**
- Headers: nenhum (rota pública — não exige login)
- Query params: `q=string`, `page=number`

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`
- Query params: `q=string`, `page=number`
- Response 200:
```json
{
  "results": [
    {
      "tmdbId": "number",
      "tmdbType": "MOVIE | TV",
      "title": "string",
      "year": "number | null",
      "posterUrl": "string (URL) | null",
      "badge": "Filme | Série"
    }
  ],
  "page": "number",
  "totalPages": "number",
  "hasMore": "boolean"
}
```
- Erros: `400` query ausente

---

### 6. GET /api/titles/:type/:id

**Hop 1 — Browser → Next**
- Headers: nenhum (rota pública — não exige login)
- Params: `type = movie | tv`, `id = number`

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`
- Params: `type`, `id`
- Response 200:
```json
{
  "tmdbId": "number",
  "tmdbType": "MOVIE | TV",
  "title": "string",
  "year": "number | null",
  "overview": "string",
  "posterUrl": "string (URL) | null",
  "backdropUrl": "string (URL) | null",
  "runtime": "number | null",
  "seasons": "number | null",
  "tmdbRating": "number",
  "genres": ["string"],
  "cast": [
    { "name": "string", "character": "string", "profileUrl": "string (URL) | null" }
  ],
  "providers": {
    "flatrate": [{ "name": "string", "logoUrl": "string (URL) | null" }],
    "rent": [{ "name": "string", "logoUrl": "string (URL) | null" }],
    "buy": [{ "name": "string", "logoUrl": "string (URL) | null" }]
  }
}
```
- Erros: `404` título não encontrado

---

## Changelog

| Data | Motivo | Assinatura |
|---|---|---|
| 2026-06-13 | Documento inicial criado | IgorRocha1603 |
| 2026-06-13 | Auth (register/login/me) corrigido conforme a implementação do back | caioplaninschek |
| 2026-06-13 | Logout `204` e remoção do `Bearer` no browser (cookie `session` automático); rotas de catálogo marcadas como públicas; restrições de cadastro alinhadas ao DTO | caioplaninschek |