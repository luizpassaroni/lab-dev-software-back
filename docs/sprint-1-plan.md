# Sprint 1 — Auth + Busca

> **Duração:** semanas 2-3 (2 semanas) | **Time:** 4 back + 4 front + 3 QA + PO
> **Demo de fim de sprint:** criar conta → login → buscar "Oppenheimer" → ver lista de resultados
> **PRD canônico:** `docs/PRD.md` no repo do projeto. Este arquivo é o resumo operacional da Sprint 1; dúvidas de "por quê?" ficam no PRD.

---

## Pré-requisito paralelo — Sprint 0 / infra

A infraestrutura do back roda **em paralelo** à Sprint 1 como issue de Sprint 0, não como entrega funcional da demo.

- **Issue:** `ISSUE-BACK-00 — [infra] Azure VM + Docker compose + Bicep + GitHub Actions`
- **Owner planejado:** Eduardo Fernandes
- **Branch/PR esperado:** `feat/infra-cicd`
- **Objetivo:** deixar Azure VM, Docker compose, Postgres em container, Bicep e GitHub Actions prontos para sustentar o back quando a sprint integrar e quando o deploy publicado chegar.

> A demo da Sprint 1 pode rodar localmente. O deploy publicado continua sendo fechamento de Sprint 4; a infra do back é antecipada porque desbloqueia estabilidade, CI/CD e o caminho final de produção definido no PRD v1.1.

---

## Escopo

**Dentro — 4 user stories do PRD:**

- **US-1.1** Cadastro (email + senha, hash argon2/bcrypt, validação de nome)
- **US-1.2** Login (JWT 24h, rate limit 5/15min)
- **US-1.3** Logout (só client-side — apaga token do storage)
- **US-2.1** Busca de filmes **e** séries (TMDB `/search/multi`, "Carregar mais")

**Fora desta sprint (não tentar adiantar):**

- Ficha do título → Sprint 2 (é pré-requisito de Onde-assistir)
- Onde assistir / provedores BR → Sprint 2
- Avaliação, visto, favorito, perfil → Sprint 2-3
- Gêneros, destaques da home e tema final dark/light → Sprint 3
- Deploy publicado do produto completo → Sprint 4
- Confirmação de email, reset de senha → fora do MVP (§5.3 do PRD)

---

## 3 endpoints — contratos a fechar no Dia 1

### `POST /auth/register`

Cria conta nova. Hash de senha em argon2 ou bcrypt. Email único no banco.

```json
// Request
{ "name": "Caio Planinschek", "email": "caio@exemplo.com", "password": "senha-de-8+" }

// Response 201
{ "id": 1, "name": "Caio Planinschek", "email": "caio@exemplo.com" }
```

| Código | Quando |
|---|---|
| `400` | Validação: name 2-60 / regex email / senha < 8 |
| `409` | Email já existe |

---

### `POST /auth/login`

Retorna JWT com expiração de 24h. Rate limit 5 tentativas / 15min por IP via `@nestjs/throttler`.

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
| `401` | Email não existe **ou** senha errada (mensagem genérica — não revelar qual dos dois) |
| `429` | Rate limit estourou |

---

### `GET /titles/search?q=<query>&page=<n>`

Busca mista filme + série via TMDB `/search/multi` filtrando resultados de pessoa. Cache em memória 1h.

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
| `400` | `q` ausente/vazio ou `page` inválido |
| `502` | TMDB indisponível ou retornou erro |

---

## 4 telas — front

| Tela | Conteúdo principal | Estado vazio / borda |
|---|---|---|
| **Cadastro** | Form: nome, email, senha. Botão "Criar conta". Link "Já tenho conta". Validação inline campo a campo. | 400 → erro no campo; 409 → "Este email já está cadastrado" |
| **Login** | Form: email, senha. Botão "Entrar". Link "Criar conta". | 401 → "Email ou senha inválidos"; 429 → "Muitas tentativas, aguarde alguns minutos" |
| **Home** | Header com logo + barra de busca. **Sem destaques, filtros ou tema final nesta sprint**. | "Digite algo na barra para começar" |
| **Resultados** | Grade de cards: poster + título + ano + badge filme/série. Botão "Carregar mais" no rodapé. | "Nenhum resultado para '<query>'. Tente outro termo." |

> **Logout** não é tela — é um botão no header (visível só logado) que limpa o token do storage e redireciona pra Home.

---

## Ordem sugerida — 10 dias úteis

1. **Dia 1 — kickoff (call 30min, back + front + PO):** fechar os 3 contratos acima. Qualquer mudança que apareça depois vai para `docs/contratos-api-s1.md` no repo back, com data e motivo.
2. **Dias 2-7 (semana 1) — paralelo:**
   - **Back:** scaffold módulo `auth/` (controller + service + DTOs + Prisma + Jwt + Throttler) → módulo `titles/` (service que chama TMDB + cache-manager).
   - **Front:** telas Cadastro e Login contra mock local → Home + Resultados contra mock local.
   - **Infra:** Eduardo segue com `feat/infra-cicd` em paralelo, sem bloquear mock/front nem a implementação local dos endpoints.
3. **Dia 8 — integração:** front troca URL do mock pelo endpoint real (back rodando localmente ou em ambiente de integração disponível). Bugs de contrato resolvidos lado-a-lado.
4. **Dias 9-10:** QA manual (Fernanda, Gabriel Santarello, Luiz Felipe) → ajustes → ensaiar demo.

---

## Mock plan — anti-bloqueio (decisão registrada no PRD §14)

**Front não espera o back.** Cada tela é desenvolvida contra um mock local que retorna **exatamente** o JSON definido nos contratos acima. Quando o back termina um endpoint, o front troca só a URL — contrato batendo, zero retrabalho.

Exemplo de mock no front:

```ts
// src/services/auth.mock.ts
export const registerMock = async (body: RegisterBody) => ({
  id: 1, name: body.name, email: body.email
});

export const loginMock = async (body: LoginBody) => ({
  access_token: "mock.jwt.token",
  user: { id: 1, name: "Mock User", email: body.email }
});
```

A troca pelo endpoint real é uma linha:

```ts
// import { registerMock as register } from "./auth.mock";
import { register } from "./auth.api";
```

---

## Critérios de "feito" da sprint

- [ ] 3 endpoints respondendo com o payload acordado em ambiente local ou de integração
- [ ] 4 telas navegáveis ponta-a-ponta contra o back real
- [ ] **6 cenários obrigatórios de `auth.service`** passando no Jest (cadastro OK / email duplicado / login OK / senha errada / email inexistente / rate limit — §8 do PRD)
- [ ] **3 cenários de `titles.service`** passando no Jest (search OK / cache hit não chama TMDB de novo / erro TMDB tratado sem crash — §8 do PRD)
- [ ] Demo funciona end-to-end sem crash em call do Discord
- [ ] Zero senha ou token em log (checagem visual no PR — regra dura do PRD §8)
- [ ] `ISSUE-BACK-00` tem status claro no board: concluída, em review, ou pendente sem bloquear a demo local da Sprint 1

---

## Quem faz o quê (a confirmar no Dia 1)

- **Back (Eduardo, Igor, João Victor, Lucas):** dividir entre quem pega `auth/` e quem pega `titles/`. PO sugere 2 e 2.
- **Infra Sprint 0 (Eduardo Fernandes):** Azure VM + Docker compose + Bicep + Actions no PR `feat/infra-cicd`.
- **Front (Carlos, Davi, Felipe, Gabriel Franciscone):** dividir entre Cadastro+Login e Home+Resultados. Lib de UI é decisão do time de front.
- **QA (Fernanda, Gabriel Santarello, Luiz Felipe):** roteiro de teste manual a partir desta página + acompanhamento da integração no Dia 8.
- **PO (Caio):** kickoff, desbloqueio, garantir que mock plan funciona e manter PRD/sprint plan alinhados.

---

## O que **não** está aqui

Tudo que é arquitetural, justificativa de decisão, escopo total do MVP, riscos do projeto inteiro e roadmap das 8 semanas está no **PRD** em `docs/PRD.md`. Esta página existe pra ser lida em 5 minutos antes de começar a codar; o PRD existe pra resolver dúvidas quando elas aparecem.
