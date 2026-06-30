# Backlog ágil — Guia de Streaming (Plot Twist)

Síntese navegável do backlog do projeto. O backlog real vive nas **issues do GitHub**
dos dois repositórios, organizadas por **epic** (label) e por **sprint** (milestone).
Esta página é o índice; cada item aponta para a issue de origem.

- **Backend (Nest):** https://github.com/luizpassaroni/lab-dev-software-back
- **Frontend (Next):** https://github.com/luizpassaroni/lab-dev-software-front

**Processo:** Scrum enxuto — backlog em GitHub Issues, planejado por sprint
(`docs/sprint-0-plan.md`, `docs/sprint-1-plan.md`), entregue por *feature branch* →
**Pull Request** com review do time → merge na `main` (Sprint 2 passou por `develop`).
CI/CD via GitHub Actions (build/test → GHCR → Azure). Convenção de commits
**Conventional Commits**: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`.

**Números:** 66 issues no total — **39 no back** (35 fechadas, 4 abertas, todas META de
documentação de entrega) e **27 no front** (todas fechadas).

---

## Epics

Cada issue carrega o label do seu epic. Os links abrem a lista filtrada da issue no GitHub.

| Epic | Descrição | Histórias-chave | Issues |
|---|---|---|---|
| `epic:auth` | Cadastro, login, logout, sessão (cookie HttpOnly + JWT 24h) | US-1.1, US-1.2, US-1.3 | [back](https://github.com/luizpassaroni/lab-dev-software-back/issues?q=is%3Aissue+label%3A%22epic%3Aauth%22) · [front](https://github.com/luizpassaroni/lab-dev-software-front/issues?q=is%3Aissue+label%3A%22epic%3Aauth%22) |
| `epic:catalogo` | Busca, ficha do título, "onde assistir", gêneros/discover | US-2.1, US-2.2, US-3.1 | [back](https://github.com/luizpassaroni/lab-dev-software-back/issues?q=is%3Aissue+label%3A%22epic%3Acatalogo%22) · [front](https://github.com/luizpassaroni/lab-dev-software-front/issues?q=is%3Aissue+label%3A%22epic%3Acatalogo%22) |
| `epic:historico` | Avaliar, marcar visto, favoritar, perfil | US-4.1, US-4.2, US-4.3, US-4.4 | [back](https://github.com/luizpassaroni/lab-dev-software-back/issues?q=is%3Aissue+label%3A%22epic%3Ahistorico%22) · [front](https://github.com/luizpassaroni/lab-dev-software-front/issues?q=is%3Aissue+label%3A%22epic%3Ahistorico%22) |
| `epic:infra` | Setup, env, BFF, guards, rate-limit, segurança | transversal | [back](https://github.com/luizpassaroni/lab-dev-software-back/issues?q=is%3Aissue+label%3A%22epic%3Ainfra%22) · [front](https://github.com/luizpassaroni/lab-dev-software-front/issues?q=is%3Aissue+label%3A%22epic%3Ainfra%22) |
| `epic:ui` | Tema claro/escuro, responsividade | US-5.x | [front](https://github.com/luizpassaroni/lab-dev-software-front/issues?q=is%3Aissue+label%3A%22epic%3Aui%22) |
| `epic:deploy` | Publicação online + HTTPS | — | [back](https://github.com/luizpassaroni/lab-dev-software-back/issues?q=is%3Aissue+label%3A%22epic%3Adeploy%22) · [front](https://github.com/luizpassaroni/lab-dev-software-front/issues?q=is%3Aissue+label%3A%22epic%3Adeploy%22) |
| `epic:testes` | Cenários de teste do PRD §8 | — | [back](https://github.com/luizpassaroni/lab-dev-software-back/issues?q=is%3Aissue+label%3A%22epic%3Atestes%22) · [front](https://github.com/luizpassaroni/lab-dev-software-front/issues?q=is%3Aissue+label%3A%22epic%3Atestes%22) |
| `epic:meta` | Kickoff, documentação e entrega acadêmica | META-1..6 | [back](https://github.com/luizpassaroni/lab-dev-software-back/issues?q=is%3Aissue+label%3A%22epic%3Ameta%22) |

---

## Sprints

O backlog foi entregue em quatro marcos (milestones do GitHub).

### Sprint 0 — Setup (paralela) · `docs/sprint-0-plan.md`
Preparar o terreno: os dois repos rodando localmente + CI/CD de pé. Sem demo funcional.
- Back: infra Azure VM + Docker compose + Bicep + Actions — [#18](https://github.com/luizpassaroni/lab-dev-software-back/issues/18).
- Front: scaffold Next.js + CI (lint+build) — [#10](https://github.com/luizpassaroni/lab-dev-software-front/issues/10).

### Sprint 1 — Núcleo demonstrável · `docs/sprint-1-plan.md`
Auth (BFF) + busca + ficha + onde assistir, rodando localmente.
- **Auth:** cadastro [#6](https://github.com/luizpassaroni/lab-dev-software-back/issues/6), login [#7](https://github.com/luizpassaroni/lab-dev-software-back/issues/7), `GET /auth/me` [#25](https://github.com/luizpassaroni/lab-dev-software-back/issues/25), logout BFF [#8](https://github.com/luizpassaroni/lab-dev-software-back/issues/8); telas de login [#4](https://github.com/luizpassaroni/lab-dev-software-front/issues/4) e cadastro [#3](https://github.com/luizpassaroni/lab-dev-software-front/issues/3).
- **Catálogo:** cliente TMDB [#9](https://github.com/luizpassaroni/lab-dev-software-back/issues/9), busca [#10](https://github.com/luizpassaroni/lab-dev-software-back/issues/10), ficha + provedores BR [#26](https://github.com/luizpassaroni/lab-dev-software-back/issues/26); telas de busca [#6](https://github.com/luizpassaroni/lab-dev-software-front/issues/6), ficha [#12](https://github.com/luizpassaroni/lab-dev-software-front/issues/12) e onde assistir [#13](https://github.com/luizpassaroni/lab-dev-software-front/issues/13).
- **Infra:** guard de chave interna [#24](https://github.com/luizpassaroni/lab-dev-software-back/issues/24), camada BFF `/api/*` [#11](https://github.com/luizpassaroni/lab-dev-software-front/issues/11).

### Sprint 2 — Histórico, perfil, UI e deploy · milestone "Sprint 2"
Avaliar/visto/favorito + perfil + Home + tema + responsividade + publicação online.
- **Histórico:** migration enum+origem [#60](https://github.com/luizpassaroni/lab-dev-software-back/issues/60), avaliação 1–10 + auto-visto [#61](https://github.com/luizpassaroni/lab-dev-software-back/issues/61), visto [#62](https://github.com/luizpassaroni/lab-dev-software-back/issues/62), favorito [#63](https://github.com/luizpassaroni/lab-dev-software-back/issues/63), perfil [#64](https://github.com/luizpassaroni/lab-dev-software-back/issues/64), `userState` na ficha [#69](https://github.com/luizpassaroni/lab-dev-software-back/issues/69); UIs de avaliação [#32](https://github.com/luizpassaroni/lab-dev-software-front/issues/32), visto/favorito [#33](https://github.com/luizpassaroni/lab-dev-software-front/issues/33) e tela de perfil [#34](https://github.com/luizpassaroni/lab-dev-software-front/issues/34).
- **Catálogo:** gêneros + discover [#65](https://github.com/luizpassaroni/lab-dev-software-back/issues/65), "Em alta" sem gênero [#87](https://github.com/luizpassaroni/lab-dev-software-back/issues/87); chips de gênero [#35](https://github.com/luizpassaroni/lab-dev-software-front/issues/35), redesign da Home [#54](https://github.com/luizpassaroni/lab-dev-software-front/issues/54).
- **UI:** dark/light [#36](https://github.com/luizpassaroni/lab-dev-software-front/issues/36), responsividade [#37](https://github.com/luizpassaroni/lab-dev-software-front/issues/37).
- **Deploy:** HTTPS no back [#67](https://github.com/luizpassaroni/lab-dev-software-back/issues/67), deploy Azure [#68](https://github.com/luizpassaroni/lab-dev-software-back/issues/68), deploy front Vercel [#38](https://github.com/luizpassaroni/lab-dev-software-front/issues/38).

### Fechamento — Documentação de entrega · milestone "Fechamento"
Artefatos acadêmicos da entrega final (epic `meta`, no back).
- [#80](https://github.com/luizpassaroni/lab-dev-software-back/issues/80) META-4 README "do zero" (fechada) · [#78](https://github.com/luizpassaroni/lab-dev-software-back/issues/78) META-2 DER + arquitetura (fechada).
- Abertas: [#77](https://github.com/luizpassaroni/lab-dev-software-back/issues/77) META-1 relatório acadêmico · [#79](https://github.com/luizpassaroni/lab-dev-software-back/issues/79) META-3 telas · [#81](https://github.com/luizpassaroni/lab-dev-software-back/issues/81) META-5 validação e2e · [#82](https://github.com/luizpassaroni/lab-dev-software-back/issues/82) META-6 empacotamento.

---

## Onde ver o backlog completo

Lista de issues (abertas + fechadas) como evidência da organização ágil:

- **Back:** https://github.com/luizpassaroni/lab-dev-software-back/issues?q=is%3Aissue
- **Front:** https://github.com/luizpassaroni/lab-dev-software-front/issues?q=is%3Aissue
- **Milestones (sprints):** https://github.com/luizpassaroni/lab-dev-software-back/milestones · https://github.com/luizpassaroni/lab-dev-software-front/milestones

Artefatos relacionados nesta pasta: planos de sprint (`sprint-0-plan.md`, `sprint-1-plan.md`),
referência da API (`api.md`), diagramas (`arquitetura.png`, `banco_de_dados.png`) e
catálogo de telas (`telas/`).
