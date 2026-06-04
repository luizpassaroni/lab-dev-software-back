# Sprint 0 — Setup (paralela)

**Em uma frase:** preparar o terreno antes de construir — deixar o front e o back rodando na máquina de cada um e a publicação automática (CI/CD) de pé — para que a Sprint 1 só precise construir as telas e a API, sem perder tempo com setup.

> **Período:** até ~07/06 (roda **em paralelo** ao início da Sprint 1) · **Time:** infra (back) + front · **PO:** Caio
> **Meta:** os dois repos rodando localmente + pipeline de CI/CD de pé, pra a Sprint 1 só construir feature.
> **Não tem demo funcional** — é o trilho, não o trem. O que destrava a S1 é isto aqui.
> **PRD canônico:** `docs/PRD.md` (§13.2, §16). Dúvida de "por quê?" → PRD. Detalhe de execução → `issues-back.md` / `issues-front.md`.

---

## Como ler (3 min)

- **Prioridade:** **P0** = núcleo inegociável da entrega 02/07 (legenda no PRD §0.3). Toda issue da S0 é P0 — sem trilho, nada da S1 anda.
- **Status:** ✅ feito · ⏳ pendente · ❓ a confirmar.
- **Termos** seguem o `CONTEXT.md` (glossário canônico do projeto, na raiz do repo). Em conflito de termo, o glossário vence.
- Esta página é o **índice** da sprint. O passo-a-passo de cada issue vive na própria issue (`issues-*.md` → vira issue no GitHub).

---

## Estado do setup (2026-06-01)

| Item | Estado | Nota |
|---|---|---|
| Scaffold Nest + Prisma 7 + Postgres (back) | ✅ feito | commit inicial do Igor (23/05); schema dos 4 modelos já desenhado |
| `main` como default no back e no front | ✅ feito | ambos os repos |
| Eduardo Fernandes com acesso ao repo back | ✅ feito | já abriu PR (#16) |
| **Scaffold Next.js no front** | ⏳ pendente | **crítico — bloqueia todas as telas da S1** · [#10](https://github.com/luizpassaroni/lab-dev-software-front/issues/10) |
| **CI básico no front** (lint + build) | ⏳ pendente | Vercel cuida do deploy; o CI só guarda qualidade do PR (entra junto da [#10](https://github.com/luizpassaroni/lab-dev-software-front/issues/10)) |
| **Infra do back** (Azure VM + Bicep + Docker compose + Actions) | ✅ feito | [#18](https://github.com/luizpassaroni/lab-dev-software-back/issues/18) (`ISSUE-BACK-00`) fechada via PR #16; pipeline com follow-up: PR #22 (região Bicep) + PR #27 (parser `DATABASE_URL` + Caddy/HTTPS) |

---

## Issues da Sprint 0

> 1–3 linhas de orientação por issue. Detalhe completo (contexto, critérios, guia de execução) na issue.

| ID | # | Título | Repo | Pri | Owner | Estado |
|---|---|---|---|---|---|---|
| **ISSUE-BACK-00** | [#18](https://github.com/luizpassaroni/lab-dev-software-back/issues/18) | Infra Azure VM + Docker compose + Bicep + GitHub Actions | back | P0 | Eduardo (`eduoncode`) | ✅ fechada (via PR #16) |
| **ISSUE-FRONT-00** | [#10](https://github.com/luizpassaroni/lab-dev-software-front/issues/10) | Scaffold Next.js + CI básico (lint + build) | front | P0 | a definir | aberta |

- **ISSUE-BACK-00 (#18) — Infra. ✅ fechada via PR #16.** Provisiona a Azure VM via Bicep, sobe `docker-compose.yml` com Nest (`:3000→VM:80`) + Postgres (`:5432` rede interna), e pipeline GitHub Actions estrita à `main`. Garante `INTERNAL_API_KEY` (chave interna do BFF) nos secrets/ambiente da VM — ver PRD §8.1/§8.3. Não entra na demo da S1; existe pra estabilizar CI e o caminho de produção. PRs de IaC/compose/pipeline exigem **2 aprovações**. **Follow-up (01/06):** o pipeline seguiu recebendo correções pós-fechamento — `PR #22` (região do Bicep) e `PR #27` (parser da `DATABASE_URL` + domínio do Caddy/HTTPS). A issue está fechada, mas o deploy ainda **não rodou verde ponta-a-ponta** — isso é a `BACK-27` (S2).
- **ISSUE-FRONT-00 (#10) — Scaffold Next.js.** `create-next-app` (App Router, TypeScript) + CI GitHub Actions rodando `lint` + `build` no PR. É o **gargalo da S1**: a `ISSUE-FRONT-01` (estrutura base) e todas as telas dependem deste scaffold existir. Deploy é da Vercel (não precisa de pipeline de deploy no CI).

> O scaffold do back **já está feito** — não vira issue. Se faltar algo (ex.: `.gitignore` incompleto), trata como ajuste dentro das issues de config da S1 (BACK-03/04), não como issue de S0.

---

## Sequência

S0 é **paralela**, não sequencial:

1. **Agora:** front roda `create-next-app` e abre o PR do scaffold (FRONT-00); Eduardo segue a infra (BACK-00 / PR #16). Os dois caminhos **não se bloqueiam**.
2. **Antes do Dia 1 da S1 (~01/06):** scaffold do front (`ISSUE-FRONT-00` / [#10](https://github.com/luizpassaroni/lab-dev-software-front/issues/10)) **mergeado** em `main` — sem ele, o front da S1 não tem onde construir. *(Em 01/06 a #10 ainda está aberta — é o bloqueio vivo a fechar primeiro.)*
3. **Infra (BACK-00)** pode fechar depois do início da S1 sem travar a demo local — a demo da S1 roda em ambiente local; a infra publicada é pré-requisito do **deploy** (Sprint 2), não da demo da S1.

---

## Quem faz o quê (confirmar no kickoff)

- **Infra (back):** Eduardo Fernandes — `feat/infra-cicd` / PR #16. Precisa de 2 aprovadores no merge (regra de PRs de infra).
- **Scaffold (front):** um par do time de front (Carlos / Davi / Felipe / Gabriel Franciscone) — quem pegar abre o PR cedo, porque destrava todo mundo.
- **PO (Caio):** garantir que o scaffold do front feche antes do Dia 1 e que `INTERNAL_API_KEY` esteja prevista nos secrets dos dois lados (VM e Vercel server-side).

---

## Critérios de "feito" da Sprint 0

- [ ] `npm run dev` sobe o front; `http://localhost:3000` abre sem erro.
- [ ] CI do front roda `lint` + `build` no PR e bloqueia merge se quebrar.
- [ ] Back sobe local (`npm run start:dev`) com Postgres via Docker; `prisma migrate dev` aplica o schema.
- [ ] Azure VM provisionada via Bicep; `docker-compose` sobe Nest + Postgres; pipeline dispara no merge à `main`.
- [ ] `INTERNAL_API_KEY`, `JWT_SECRET` e `TMDB_API_TOKEN` previstos em GitHub Secrets / ambiente da VM / Vercel server-side — **sem valores no repo**.
- [ ] `ISSUE-BACK-00` (#18) com status claro no board: concluída, em review, ou pendente **sem bloquear** a demo local da S1.

---

## O que **não** está aqui

Justificativa de arquitetura, escopo do MVP, RNF e roadmap → **PRD** (`docs/PRD.md`). Passo-a-passo de cada issue → `issues-back.md` / `issues-front.md`. Esta página é pra ser lida em 3 min antes de pegar uma task de setup.
