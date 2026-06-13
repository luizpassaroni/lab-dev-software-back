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
  "name": "string (2-60 chars)",
  "email": "string",
  "password": "string"
}
```

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`, `Content-Type: application/json`
- Body: mesmo do Hop 1
- Response 201:
```json
{ "accessToken": "string" }
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

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`, `Content-Type: application/json`
- Body: mesmo do Hop 1
- Response 200:
```json
{ "accessToken": "string" }
```
- Erros: `400` campos inválidos, `401` credenciais incorretas, `429` rate limit

---

### 3. POST /api/auth/logout

**Hop 1 — Browser → Next**
- Headers: `Authorization: Bearer <token>`
- ⚠️ Logout tratado apenas no Next (invalida cookie/sessão) — não há endpoint no Nest.
- Response 200:
```json
{ "message": "ok" }
```

---

### 4. GET /api/auth/me

**Hop 1 — Browser → Next**
- Headers: `Authorization: Bearer <token>`

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`, `Authorization: Bearer <token>`
- Response 200:
```json
{
  "id": "number",
  "name": "string",
  "email": "string",
  "createdAt": "string (ISO 8601)"
}
```
- Erros: `401` token inválido/expirado

---

### 5. GET /api/titles/search

**Hop 1 — Browser → Next**
- Headers: `Authorization: Bearer <token>`
- Query params: `q=string`, `page=number`

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`, `Authorization: Bearer <token>`
- Query params: `q=string`, `page=number`
- Response 200:
```json
{
  "results": [
    {
      "tmdbId": "number",
      "type": "movie | tv",
      "title": "string",
      "poster": "string (URL)",
      "year": "number"
    }
  ],
  "page": "number",
  "totalPages": "number"
}
```
- Erros: `400` query ausente, `401` token inválido

---

### 6. GET /api/titles/:type/:id

**Hop 1 — Browser → Next**
- Headers: `Authorization: Bearer <token>`
- Params: `type = movie | tv`, `id = number`

**Hop 2 — Next → Nest**
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`, `Authorization: Bearer <token>`
- Params: `type`, `id`
- Response 200:
```json
{
  "tmdbId": "number",
  "type": "movie | tv",
  "title": "string",
  "overview": "string",
  "poster": "string (URL)",
  "genres": ["string"],
  "releaseDate": "string",
  "watchProvidersBR": ["string"]
}
```
- Erros: `401` token inválido, `404` título não encontrado

---

## Changelog

| Data | Motivo | Assinatura |
|---|---|---|
| 2026-06-13 | Documento inicial criado | IgorRocha1603 |