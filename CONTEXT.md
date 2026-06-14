# CONTEXT.md — Guia de Streaming

Glossário canônico do projeto: o vocabulário fechado que o time usa em issues, PRs, commits, código e documentação. **Em conflito de termo, este glossário vence.** Se um termo novo passar a aparecer com frequência, registre aqui em vez de deixar cada um inventar o seu.

**Ordem de leitura do projeto:** `PRD.md` (o quê e o porquê) → **`CONTEXT.md`** (vocabulário) → `sprint-N-plan.md` (o recorte da sprint) → a issue (a tarefa). Este arquivo sobe **idêntico na raiz dos dois repositórios** (back e front).

## Glossário

| Use | Significa | Não use |
|---|---|---|
| **título** | um filme **ou** uma série, sempre referenciado por id da TMDB + tipo | mídia, conteúdo, obra |
| **filme / série** | os dois tipos de título; no banco, `tmdbType` = `MOVIE` / `TV` | seriado, filme/série sem badge |
| **ficha do título** | a página de detalhe de um título: sinopse, poster, elenco, duração/temporadas, nota TMDB, gêneros e onde assistir | página de produto, detalhe |
| **onde assistir** | a área da ficha que lista os provedores de streaming no Brasil (TMDB `watch/providers`, `region=BR`) | streamings (como seção), disponibilidade |
| **provedor** | o serviço onde o título está disponível (Netflix, Prime Video, Disney+…) | plataforma, canal |
| **avaliação** | a nota **inteira de 1 a 10** que o usuário logado dá a um título | review, rating, like |
| **visto** | marca de que o usuário já assistiu o título; `origem = auto` (veio da avaliação) ou `manual` | assistido |
| **favorito** | título marcado como favorito (gosto afetivo, sem ordem temporal) | curtida, "quero ver" |
| **BFF** | o Next.js como intermediário: o navegador fala só com o Next (`/api/*`) e o Next fala com o Nest | gateway, API gateway, proxy reverso |
| **sessão** | o login do usuário, guardado no **cookie `session`** (HttpOnly, setado pelo Next) | token no browser, JWT no localStorage |
| **Bearer interno** | o JWT que trafega **só** no canal interno Next → Nest (`Authorization: Bearer`) | token do front, header de auth do navegador |
| **chave interna** | o header **`X-Internal-Key`** que o Next injeta em toda chamada ao Nest (env `INTERNAL_API_KEY`) | api key, secret, token interno |
| **Nota TMDB** | a nota que vem da TMDB, exibida na ficha — distinta da **avaliação** do usuário | nota (sem qualificar) |

## Notas

- **"Quero ver" (watchlist)** é uma lista separada de favoritos e está **fora do MVP** (stretch — PRD §5.3). Não usar como sinônimo de favorito.
- O desenho de autenticação (cookie de sessão, Bearer interno, chave interna) está fechado no **PRD §8.1**; não invente fluxo de cookie/token fora dele.
