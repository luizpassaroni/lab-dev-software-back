# Telas da aplicação

Capturas da aplicação publicada em desktop. Para cada tela, o arquivo com o
nome canônico usa o tema escuro; a variante `-light.png` registra o tema claro.

## 1. Home (`/`)

Capturas: [tema escuro](home.png) · [tema claro](home-light.png)

**Objetivo:** porta de entrada; buscar ou descobrir títulos.

**Fluxo:** hero com a marca "Plot Twist" e a busca; abaixo, grade "Em alta" e
chips de gênero; clicar num card abre a ficha.

**Ações:** buscar por texto; filtrar por gênero; abrir a ficha de um título;
alternar tema claro/escuro; entrar/cadastrar.

## 2. Busca (`/busca?q=`)

Capturas: [tema escuro](busca.png) · [tema claro](busca-light.png)

**Objetivo:** listar resultados de filmes e séries para um termo.

**Fluxo:** o termo vem da Home/Header; a grade mostra cards com pôster, título,
ano e selo Filme/Série; sem termo, volta para a Home.

**Ações:** abrir ficha; refazer a busca; favoritar direto no card (se logado).

## 3. Ficha do título (`/titulo/[type]/[id]`)

Capturas: [tema escuro](ficha.png) · [tema claro](ficha-light.png)

**Objetivo:** detalhes completos e "onde assistir".

**Fluxo:** pôster/backdrop, sinopse, elenco, nota TMDB, gêneros,
duração/temporadas; bloco destacado "Onde assistir" (assinatura, aluguel,
compra) com provedores BR; controles de avaliação/visto/favorito.

**Ações:** avaliar de 1 a 10; marcar visto; favoritar; ver provedores. As ações
de histórico pedem login.

## 4. Login (`/login`)

Capturas: [tema escuro](login.png) · [tema claro](login-light.png)

**Objetivo:** autenticar usuário existente.

**Fluxo:** email + senha; sucesso cria a sessão (cookie) e volta navegando;
mostra aviso quando vindo do cadastro.

**Ações:** entrar; ir para o cadastro.

## 5. Cadastro (`/cadastro`)

Capturas: [tema escuro](cadastro.png) · [tema claro](cadastro-light.png)

**Objetivo:** criar conta.

**Fluxo:** nome (3–50), email e senha (mín. 8); ao concluir, segue para o login
(cadastro não inicia sessão).

**Ações:** cadastrar; ir para o login.

## 6. Perfil (`/perfil`, protegida)

Capturas: [tema escuro](perfil.png) · [tema claro](perfil-light.png)

**Objetivo:** painel pessoal do usuário logado.

**Fluxo:** cabeçalho com nome; totais de vistos/avaliados/favoritos; listas
recentes de cada categoria. Sem sessão, redireciona para o login.

**Ações:** navegar para fichas a partir das listas; sair (logout).
