# Issues publicadas — Sprint 1

> Gerado em 2026-05-24 a partir de `issues-back.md` (14) + `issues-front.md` (9). Total inicial: **23 issues** em 2 repos.
> Atualizado em 2026-05-27 após sincronização real no GitHub + arquivos locais revisados pelo PRD v1.1.
> Este arquivo é um **log operacional compartilhável**: deve existir uma cópia em `docs/issues-publicadas.md` no repo back e outra no repo front.

## Resumo atual

| Repo | Issues publicadas | Estado | Observação |
|---|---:|---|---|
| `luizpassaroni/lab-dev-software-back` | 15 | todas abertas | `ISSUE-BACK-00` publicada como `#18`; `#18`, `#1`, `#2`, `#3`, `#4`, `#5` e `#9` têm assignee |
| `luizpassaroni/lab-dev-software-front` | 9 | todas abertas | sem assignees no momento da verificação |

Milestones atuais: `Sprint 0` (#2 no back) e `Sprint 1` (#1 em ambos os repos). Labels usadas: `sprint-0`, `sprint-1`, `back`/`front` e `epic:*`.

Sincronização executada em 2026-05-27:

- Backend: criada `ISSUE-BACK-00` como `#18` e atualizadas `#1` a `#14` a partir de `issues-back.md`, preservando assignees, comentários, histórico e estado.
- Frontend: atualizadas `#1` a `#9` a partir de `issues-front.md`, preservando assignees, comentários, histórico e estado.

## Backend — `luizpassaroni/lab-dev-software-back`

Milestones:

- Sprint 0: <https://github.com/luizpassaroni/lab-dev-software-back/milestone/2>
- Sprint 1: <https://github.com/luizpassaroni/lab-dev-software-back/milestone/1>

| ID interno | # GitHub | Estado | Assignee atual | URL | Título atual no GitHub |
|---|---:|---|---|---|---|
| ISSUE-BACK-00 | #18 | open | `eduoncode` | <https://github.com/luizpassaroni/lab-dev-software-back/issues/18> | ISSUE-BACK-00 — [infra] Azure VM + Docker compose + Bicep + GitHub Actions |
| ISSUE-BACK-01 | #1 | open | `joaovictorBC` | <https://github.com/luizpassaroni/lab-dev-software-back/issues/1> | ISSUE-BACK-01 — [config] Bootstrap JwtModule + JWT_SECRET no .env |
| ISSUE-BACK-02 | #2 | open | `joaovictorBC` | <https://github.com/luizpassaroni/lab-dev-software-back/issues/2> | ISSUE-BACK-02 — [config] @nestjs/throttler global + rate limit no /auth/login |
| ISSUE-BACK-03 | #3 | open | `joaovictorBC` | <https://github.com/luizpassaroni/lab-dev-software-back/issues/3> | ISSUE-BACK-03 — [config] nestjs-pino + exception filter global para 5xx |
| ISSUE-BACK-04 | #4 | open | `caioplaninschek` | <https://github.com/luizpassaroni/lab-dev-software-back/issues/4> | ISSUE-BACK-04 — [config] @nestjs/cache-manager + bootstrap do módulo titles |
| ISSUE-BACK-05 | #5 | open | `IgorRocha1603` | <https://github.com/luizpassaroni/lab-dev-software-back/issues/5> | ISSUE-BACK-05 — [migration] Prisma — adicionar `name` no User + garantir email unique |
| ISSUE-BACK-06 | #6 | open | — | <https://github.com/luizpassaroni/lab-dev-software-back/issues/6> | ISSUE-BACK-06 — [auth] Endpoint POST /auth/register |
| ISSUE-BACK-07 | #7 | open | — | <https://github.com/luizpassaroni/lab-dev-software-back/issues/7> | ISSUE-BACK-07 — [auth] Endpoint POST /auth/login (emite JWT) |
| ISSUE-BACK-08 | #8 | open | — | <https://github.com/luizpassaroni/lab-dev-software-back/issues/8> | ISSUE-BACK-08 — [auth] Logout — documentar contrato no README (sem endpoint server-side) |
| ISSUE-BACK-09 | #9 | open | `caioplaninschek` | <https://github.com/luizpassaroni/lab-dev-software-back/issues/9> | ISSUE-BACK-09 — [titles] TMDB client base (HttpModule + API key + headers v4) |
| ISSUE-BACK-10 | #10 | open | — | <https://github.com/luizpassaroni/lab-dev-software-back/issues/10> | ISSUE-BACK-10 — [titles] Endpoint GET /titles/search (mix filme + série, cache 1h, "carregar mais") |
| ISSUE-BACK-11 | #11 | open | — | <https://github.com/luizpassaroni/lab-dev-software-back/issues/11> | ISSUE-BACK-11 — [test] auth.service — 6 cenários obrigatórios do PRD §8 |
| ISSUE-BACK-12 | #12 | open | — | <https://github.com/luizpassaroni/lab-dev-software-back/issues/12> | ISSUE-BACK-12 — [test] titles.service — 3 cenários do PRD §8 |
| ISSUE-BACK-13 | #13 | open | — | <https://github.com/luizpassaroni/lab-dev-software-back/issues/13> | ISSUE-BACK-13 — [meta] Kickoff Dia 1 — fechar contratos em `docs/contratos-api-s1.md` |
| ISSUE-BACK-14 | #14 | open | — | <https://github.com/luizpassaroni/lab-dev-software-back/issues/14> | ISSUE-BACK-14 — [meta] Atualizar `.env.example` consolidado da Sprint 1 |

## Frontend — `luizpassaroni/lab-dev-software-front`

Milestone: <https://github.com/luizpassaroni/lab-dev-software-front/milestone/1>

| ID interno | # GitHub | Estado | Assignee atual | URL | Título atual no GitHub |
|---|---:|---|---|---|---|
| ISSUE-FRONT-01 | #1 | open | — | <https://github.com/luizpassaroni/lab-dev-software-front/issues/1> | ISSUE-FRONT-01 — [infra] Estrutura base do app (App Router + layout global + header) |
| ISSUE-FRONT-02 | #2 | open | — | <https://github.com/luizpassaroni/lab-dev-software-front/issues/2> | ISSUE-FRONT-02 — [infra] Mock plan — `src/services/auth.mock.ts` + `src/services/titles.mock.ts` |
| ISSUE-FRONT-03 | #3 | open | — | <https://github.com/luizpassaroni/lab-dev-software-front/issues/3> | ISSUE-FRONT-03 — [auth] Tela Cadastro (`/cadastro`) |
| ISSUE-FRONT-04 | #4 | open | — | <https://github.com/luizpassaroni/lab-dev-software-front/issues/4> | ISSUE-FRONT-04 — [auth] Tela Login (`/login`) |
| ISSUE-FRONT-05 | #5 | open | — | <https://github.com/luizpassaroni/lab-dev-software-front/issues/5> | ISSUE-FRONT-05 — [catalogo] Tela Home (`/`) com barra de busca |
| ISSUE-FRONT-06 | #6 | open | — | <https://github.com/luizpassaroni/lab-dev-software-front/issues/6> | ISSUE-FRONT-06 — [catalogo] Tela Resultados (`/busca`) com cards + "Carregar mais" |
| ISSUE-FRONT-07 | #7 | open | — | <https://github.com/luizpassaroni/lab-dev-software-front/issues/7> | ISSUE-FRONT-07 — [auth] Hook `useAuth` + botão Logout no header |
| ISSUE-FRONT-08 | #8 | open | — | <https://github.com/luizpassaroni/lab-dev-software-front/issues/8> | ISSUE-FRONT-08 — [test] 2-3 testes de componente simbólicos (PRD §8) |
| ISSUE-FRONT-09 | #9 | open | — | <https://github.com/luizpassaroni/lab-dev-software-front/issues/9> | ISSUE-FRONT-09 — [meta] Mensagens de erro & loading consistentes em todas as telas |

---

## Sincronização executada

### Back

Fonte local autoritativa: `A4\_notas-projeto\issues-back.md`.

- `ISSUE-BACK-00` criada no repo `luizpassaroni/lab-dev-software-back` como `#18`.
- `ISSUE-BACK-00` usa labels `sprint-0`, `back`, `epic:infra`, milestone `Sprint 0` e assignee `eduoncode`.
- Issues existentes `#1` a `#14` atualizadas com título, corpo, labels e milestone atuais de `issues-back.md`, preservando número, assignees, comentários e histórico.
- Issues `#1` a `#14` permanecem na milestone `Sprint 1`.

### Front

Fonte local autoritativa: `A4\_notas-projeto\issues-front.md`.

- Issues existentes `#1` a `#9` atualizadas com título, corpo, labels e milestone atuais de `issues-front.md`, preservando número, assignees, comentários e histórico.
- Issues `#1` a `#9` permanecem na milestone `Sprint 1`.

### Log em ambos os repos

- Copiar este arquivo para:
  - `lab-dev-software-back\docs\issues-publicadas.md`
  - `lab-dev-software-front\docs\issues-publicadas.md`
- O conteúdo deve ser idêntico nos dois repos.
- Atualizar novamente este log após qualquer criação/edição real de issues durante a sessão Git/GitHub.

## Arquivos locais relacionados

- `A4\_notas-projeto\issues-back.md`
- `A4\_notas-projeto\issues-front.md`
- `A4\_notas-projeto\PRD.md`
- `A4\_notas-projeto\PRD.html`
- `A4\_notas-projeto\sprint-1-plan.md`
- `A4\sprint-1-plan.html`
