# Agente de Pesquisa, Arquitetura e Desenvolvimento — Setup para Automação Multicanal

> Documento operacional para criar um agente de pesquisa pública, arquitetura, planejamento, implementação modular, testes e deploy de uma plataforma de automação multicanal com IA, afiliados, publicação em canais e frontend estático.

---

## 1. Observação principal sobre instruções longas

Instruções personalizadas longas consomem espaço de contexto do agente e podem prejudicar o desempenho.

Por isso, este setup usa a seguinte estratégia:

- `AGENTS.md`: define o agente principal, subagentes, limites operacionais e fluxo de trabalho.
- `CLAUDE.md`: mantém apenas regras globais do projeto.
- `.claude/rules/controllers.md`: regras aplicáveis somente a controllers.
- `.claude/rules/services.md`: regras aplicáveis somente a services.
- `.claude/rules/testing.md`: regras aplicáveis somente a testes.
- `docs/PRD.md`: fonte de intenção do produto.
- `docs/high-Level-plan.md`: visão de alto nível.
- `docs/global-action-plan.md`: planejamento global por fases.
- `docs/phase-todo-plan.md`: checklist funcional por fase.

---

## 2. Pesquisa pública inicial sobre a plataforma de referência

Pelo site público analisado, a plataforma de referência se apresenta como uma plataforma de IA, afiliados e automação em tempo real, voltada para criação de conteúdo e distribuição de produtos da Shopee para canais como Instagram, Telegram, WordPress e WooCommerce.

O fluxo público observado é:

1. Importação ou consulta de produtos.
2. Geração de conteúdo com IA.
3. Criação de títulos, descrições, hashtags, artigos, reviews ou imagens.
4. Publicação ou envio para canais conectados.
5. Agendamento.
6. Consumo de créditos por uso.

O modelo público parece ser pay-per-use com créditos, cobrando por ações como geração de palavras, geração de imagens, envio para canais, consultas e publicações.

As integrações públicas descritas incluem:

- Shopee.
- Instagram/Meta.
- Telegram Bot.
- WordPress.
- WooCommerce.
- IA generativa.
- Agendamento.
- Publicação multicanal.

### Limite ético e técnico da análise

Esta pesquisa deve ser feita apenas com engenharia reversa limpa.

Permitido:

- Analisar páginas públicas.
- Mapear funcionalidades visíveis.
- Ler documentação oficial de APIs.
- Criar arquitetura própria funcionalmente equivalente.
- Implementar conectores usando APIs oficiais.
- Fazer benchmarking de produto, preço, fluxo e posicionamento.

Proibido:

- Burlar login.
- Explorar endpoints privados.
- Copiar código proprietário.
- Copiar assets proprietários.
- Capturar tráfego autenticado sem autorização.
- Contornar rate limits.
- Usar credenciais de terceiros.
- Simular comportamento de usuário quando houver API oficial.

---

## 3. Estrutura recomendada do projeto

```txt
project-root/
  AGENTS.md
  CLAUDE.md
  .claude/
    rules/
      controllers.md
      services.md
      testing.md
  docs/
    PRD.md
    high-Level-plan.md
    reverse-research.md
    global-action-plan.md
    phase-todo-plan.md
  src/
    controllers/
    services/
    integrations/
      shopee/
      telegram/
      instagram/
      wordpress/
      woocommerce/
      ai/
    modules/
    shared/
    tests/
  public/
    index.html
    assets/
      css/
        styles.css
      js/
        app.js
```

---

# 4. Arquivo `AGENTS.md`

```md
# AGENTS.md

## Agente principal: Arquiteto de Automação Multicanal

Você é um agente de arquitetura, pesquisa pública, planejamento e implementação incremental para uma API REST TypeScript e uma interface estática em HTML, CSS e JavaScript puro.

Seu objetivo é construir um setup padrão inspirado em padrões públicos de plataformas como uma plataforma de referência, usando engenharia reversa limpa: observar funcionalidades públicas, documentação oficial de integrações, fluxos de produto e modelos de negócio, sem acessar áreas privadas sem autorização, sem burlar autenticação, sem copiar código proprietário e sem explorar vulnerabilidades.

## Princípios globais

- Mantenha instruções curtas no contexto principal.
- Use `CLAUDE.md` para regras globais do projeto.
- Use `.claude/rules/*.md` para regras escopadas por camada.
- Use `docs/PRD.md` para intenção de produto.
- Use `docs/high-Level-plan.md` para visão de fases.
- Use `docs/global-action-plan.md` para planejamento estratégico.
- Use `docs/phase-todo-plan.md` para checklist funcional de baixo nível.
- Toda funcionalidade deve ter testes.
- TypeScript sempre em modo strict.
- API deve seguir boas práticas REST.
- Interface pública deve ser publicada como HTML, CSS e JavaScript puro.

## Limites de pesquisa e engenharia reversa

Permitido:

- Analisar páginas públicas.
- Mapear funcionalidades visíveis.
- Comparar preços, fluxos, proposta de valor e integrações.
- Ler documentações oficiais de APIs.
- Criar arquitetura própria funcionalmente equivalente.
- Implementar conectores usando APIs oficiais e credenciais do usuário.

Proibido:

- Burlar login.
- Explorar endpoints privados.
- Copiar código, assets proprietários ou textos comerciais extensos.
- Fazer scraping agressivo.
- Contornar limites das plataformas.
- Simular usuário em plataformas quando houver API oficial.
- Usar credenciais de terceiros.

## Subagentes

### 1. Research Analyst

Responsável por:

- Pesquisar informações públicas sobre concorrentes.
- Criar `docs/reverse-research.md`.
- Separar fatos observados de inferências.
- Citar fontes públicas.
- Identificar módulos do produto: IA, afiliados, agendamento, publicação, créditos, integrações e relatórios.

Saída obrigatória:

- Resumo executivo.
- Funcionalidades observadas.
- Hipóteses de arquitetura.
- Riscos e lacunas.
- Oportunidades para implementação própria.

### 2. Product Architect

Responsável por:

- Transformar `docs/PRD.md` em fases.
- Criar ou atualizar `docs/global-action-plan.md`.
- Organizar dependências entre módulos.
- Definir critérios de saída por fase.

Saída obrigatória:

- Fases do projeto.
- Marcos.
- Dependências.
- Trilhas paralelas.
- Critérios de aceite por fase.

### 3. Delivery Planner

Responsável por:

- Ler `docs/high-Level-plan.md` e `docs/PRD.md`.
- Criar `docs/phase-todo-plan.md`.
- Expandir cada fase em checklists funcionais.
- Evitar checklist de código baixo nível quando o objetivo for planejamento.

Saída obrigatória:

- Checklist por funcionalidade.
- Pré-requisitos.
- Testes esperados.
- Critérios de pronto.
- Pontos de documentação.

### 4. Backend Architect

Responsável por:

- Definir arquitetura REST TypeScript.
- Separar controllers, services, integrations e repositories.
- Garantir strict mode.
- Garantir contratos HTTP claros.
- Garantir idempotência onde necessário.

### 5. Automation Engineer

Responsável por:

- Projetar conectores limpos para:
  - IA.
  - Shopee afiliado.
  - Telegram Bot API.
  - Instagram/Meta API.
  - WordPress REST API.
  - WooCommerce API.
- Implementar filas, agendamentos, retries, logs e rate limits.
- Nunca usar automação irregular quando houver API oficial.

### 6. Frontend Static Engineer

Responsável por:

- Gerar HTML, CSS e JavaScript puro.
- Não exigir framework para publicação estática.
- Separar `index.html`, `assets/css/styles.css` e `assets/js/app.js`.
- Criar build simples para dev e prod quando necessário.
- Garantir acessibilidade básica e responsividade.

### 7. QA Engineer

Responsável por:

- Aplicar `.claude/rules/testing.md`.
- Criar testes unitários, integração e e2e.
- Segmentar cada teste por cenário.
- Buscar edge cases.
- Validar status code, payload, erros e contratos HTTP.

### 8. DevOps Release Manager

Responsável por:

- Configurar branches `main`, `master`, `dev` e `prod`.
- Separar deploy dev e prod.
- Criar scripts de validação.
- Documentar variáveis de ambiente.
- Garantir que `prod` só receba código validado.

## Fluxo operacional padrão

1. Pesquisar publicamente o produto de referência.
2. Registrar fatos e inferências em `docs/reverse-research.md`.
3. Definir arquitetura alvo.
4. Criar plano global em `docs/global-action-plan.md`.
5. Criar plano detalhado em `docs/phase-todo-plan.md`.
6. Implementar módulo por módulo.
7. Testar unidade, integração e e2e.
8. Preparar deploy dev.
9. Validar em dev.
10. Promover para prod.
```

---

# 5. Arquivo `CLAUDE.md`

```md
# CLAUDE.md

Este projeto é uma API REST em TypeScript com frontend estático em HTML, CSS e JavaScript puro.

## Regras globais

- TypeScript deve rodar sempre em modo `strict`.
- A API deve seguir boas práticas REST.
- Toda funcionalidade deve ser testada.
- Controllers devem cuidar de HTTP, validação, autenticação, autorização, status codes e contratos de resposta.
- Services devem concentrar regras de negócio, orquestração, transações e integrações.
- Integrações externas devem ficar atrás de interfaces claras.
- Não acessar sistemas externos sem credenciais autorizadas.
- Não burlar login, autenticação, rate limits ou políticas de plataformas.
- Preferir APIs oficiais para Instagram/Meta, Telegram, WordPress, WooCommerce, IA e afiliados.
- Planejamento de alto nível deve ficar em `docs/global-action-plan.md`.
- Planejamento detalhado por fase ou funcionalidade deve ficar em `docs/phase-todo-plan.md`.

## Rules escopadas

- Controllers: `.claude/rules/controllers.md`
- Services: `.claude/rules/services.md`
- Testes: `.claude/rules/testing.md`
```

---

# 6. Arquivo `.claude/rules/controllers.md`

```md
---
description: Regras para controllers REST
globs:
  - "src/controllers/**/*.ts"
  - "src/**/controllers/**/*.ts"
---

# Controllers

Controllers são responsáveis pela camada HTTP.

## Responsabilidades

- Receber requests.
- Validar DTOs, params, query strings e body.
- Aplicar guards de autenticação/autorização.
- Traduzir resultados dos services em respostas HTTP.
- Definir status codes corretos.
- Garantir contratos de resposta consistentes.
- Não implementar regra de negócio complexa.

## Boas práticas REST

- Use `GET` para leitura.
- Use `POST` para criação ou comandos.
- Use `PUT` ou `PATCH` para atualização.
- Use `DELETE` para remoção.
- Use status codes semanticamente corretos:
  - `200` para sucesso com corpo.
  - `201` para criação.
  - `204` para sucesso sem corpo.
  - `400` para entrada inválida.
  - `401` para não autenticado.
  - `403` para sem permissão.
  - `404` para recurso inexistente.
  - `409` para conflito.
  - `422` para regra de validação semântica.
  - `500` apenas para erro inesperado.

## Proibições

- Não acessar banco diretamente.
- Não chamar APIs externas diretamente.
- Não conter lógica de negócio profunda.
- Não mascarar erro de domínio como erro genérico.
```

---

# 7. Arquivo `.claude/rules/services.md`

```md
---
description: Regras para services e regras de negócio
globs:
  - "src/services/**/*.ts"
  - "src/**/services/**/*.ts"
---

# Services

Services concentram regras de negócio, orquestração e integração entre módulos.

## Responsabilidades

- Implementar regras de domínio.
- Orquestrar repositories, integrações e jobs.
- Controlar transações quando aplicável.
- Coordenar efeitos colaterais.
- Validar invariantes de negócio.
- Expor métodos claros para controllers.

## Integrações externas

- Toda integração externa deve ficar atrás de uma interface ou adapter.
- APIs externas devem ter timeout, retry controlado, logs e tratamento de erro.
- Tokens e secrets nunca devem ser hardcoded.
- Cada provider deve ter camada própria em `src/integrations`.
- Quando houver API oficial, não usar automação por scraping ou simulação de navegador.

## Automação

- Jobs agendados devem ser idempotentes sempre que possível.
- Publicações devem ter estado rastreável: `pending`, `scheduled`, `processing`, `published`, `failed`, `cancelled`.
- Falhas devem registrar motivo, provider, payload sanitizado e tentativa.
- Retentativas devem respeitar rate limits e políticas da plataforma.
```

---

# 8. Arquivo `.claude/rules/testing.md`

```md
---
description: Regras para testes unitários, integração e e2e
globs:
  - "src/**/*.spec.ts"
  - "src/**/*.int.spec.ts"
  - "src/**/*.e2e-spec.ts"
  - "test/**/*.ts"
  - "tests/**/*.ts"
---

# Testing

Testes existem para descobrir bugs, validar comportamentos, documentar como o sistema funciona e revelar edge cases. Eles não devem ser apenas lineares.

## Convenções de nome

- Testes unitários: `*.spec.ts`
- Testes de integração: `*.int.spec.ts`
- Testes e2e: `*.e2e-spec.ts`

## Testes unitários

A unidade testa comportamento isolado.

Use mocks quando a dependência for externa, como:

- Banco de dados.
- HTTP.
- APIs de terceiros.
- Filas.
- Sistema de arquivos.
- Relógio/data.
- Serviços externos.

Dependências internas simples podem ser declaradas diretamente quando isso tornar o teste mais claro.

Não há problema em existir teste unitário e teste de integração para o mesmo artefato. O teste unitário cobre comportamentos básicos, regras e edge cases locais; o teste de integração valida wiring e dependências externas controladas.

## Testes de integração

Testes de integração validam o funcionamento entre módulos e dependências reais ou controladas.

Devem cobrir:

- Persistência.
- Transações.
- Serialização.
- Adapters.
- Repositories.
- Integrações internas.
- Contratos entre módulos.

Use o sufixo obrigatório:

```txt
*.int.spec.ts
```

## Testes e2e

Testes e2e validam o sistema de ponta a ponta.

Devem:

- Preparar dados do banco.
- Realizar chamadas HTTP reais contra a aplicação.
- Avaliar status code.
- Avaliar payload.
- Avaliar mensagens de erro.
- Avaliar efeitos colaterais relevantes.
- Testar autenticação/autorização quando aplicável.

## Segmentação de cenários

Cada teste deve validar um cenário por vez.

Evite testes grandes que validam muitos comportamentos simultaneamente. Prefira cenários pequenos, nomeados pelo comportamento esperado.

## Cobertura esperada por funcionalidade

Para cada funcionalidade nova, avaliar:

- Caminho feliz.
- Entrada inválida.
- Recurso inexistente.
- Falha de permissão.
- Falha de provider externo.
- Retry ou comportamento idempotente, quando aplicável.
- Edge cases de domínio.
```

---

# 9. Arquitetura alvo

```txt
[Frontend estático]
  HTML/CSS/JS
      |
      v
[API REST TypeScript]
      |
      +-- Auth Module
      |     - login
      |     - registro
      |     - recuperação de senha
      |     - verificação de e-mail
      |
      +-- Credits/Billing Module
      |     - saldo
      |     - consumo por ação
      |     - extrato
      |     - recarga PIX
      |
      +-- AI Content Module
      |     - artigos
      |     - títulos
      |     - descrições
      |     - hashtags
      |     - reviews
      |     - eBooks
      |
      +-- Affiliate Product Module
      |     - busca de produtos
      |     - normalização de dados
      |     - links afiliados
      |     - imagens
      |
      +-- Scheduler Module
      |     - agendamentos
      |     - filas
      |     - retries
      |     - status de publicação
      |
      +-- Channels Module
      |     +-- Telegram Integration
      |     +-- Instagram/Meta Integration
      |     +-- WordPress Integration
      |     +-- WooCommerce Integration
      |
      +-- Reporting Module
            - ações executadas
            - custos
            - falhas
            - conversões/cliques, quando disponível
```

---

# 10. Módulos para implementar em ordem

## Fase 1 — Fundação

- Inicializar TypeScript strict.
- Criar API REST base.
- Criar estrutura `controllers`, `services`, `integrations`.
- Criar autenticação.
- Criar usuários.
- Criar configuração de ambiente.
- Criar testes mínimos de saúde.
- Criar frontend estático inicial.

## Fase 2 — Créditos e consumo

- Criar wallet de créditos.
- Criar ledger de transações.
- Registrar consumo por ação.
- Bloquear ação sem saldo.
- Criar extrato.
- Criar testes de saldo insuficiente, débito e rollback.

## Fase 3 — IA

- Criar provider de IA.
- Gerar título, descrição, hashtags e artigos.
- Registrar custo por geração.
- Salvar histórico.
- Permitir revisão manual antes de publicar.
- Testar falha de provider, conteúdo vazio e custo.

## Fase 4 — Produtos afiliados

- Criar adapter para busca/importação de produtos.
- Normalizar produto: nome, imagem, preço, link, categoria.
- Criar payload publicável.
- Testar filtros, produto inválido e ausência de link.

## Fase 5 — Telegram

- Conectar token de bot.
- Validar bot.
- Cadastrar destinos.
- Enviar mensagem e imagem.
- Agendar envios.
- Testar token inválido, destino inválido, rate limit e sucesso.

## Fase 6 — WordPress

- Cadastrar site WordPress.
- Configurar autenticação.
- Criar post como rascunho, futuro ou publicado.
- Enviar título, conteúdo, excerpt, tags e imagem destacada quando disponível.
- Testar `draft`, `publish`, falha de autenticação e payload inválido.

## Fase 7 — Instagram/Meta

- Implementar conexão via fluxo autorizado.
- Validar conta profissional/empresa.
- Criar publicação com imagem, legenda e hashtags.
- Implementar resposta automática reativa a comentários autorizados.
- Testar permissões ausentes, conta não elegível e erro de publicação.

## Fase 8 — WooCommerce

- Cadastrar loja.
- Criar produto externo/afiliado.
- Enviar título, descrição, imagem, preço e link externo.
- Testar credenciais, payload inválido e duplicidade.

## Fase 9 — Relatórios

- Mostrar ações por canal.
- Mostrar custo por ação.
- Mostrar falhas.
- Mostrar agendamentos.
- Mostrar saldo.
- Exportar CSV.

## Fase 10 — Deploy dev/prod

- Criar ambiente dev.
- Criar ambiente prod.
- Separar variáveis.
- Rodar testes antes do deploy.
- Publicar frontend estático.
- Publicar API.
- Monitorar logs.

---

# 11. Setup de dependências

## Node LTS

```bash
nvm install --lts
nvm use --lts
```

## Inicialização

```bash
npm init -y
```

## TypeScript e ferramentas

```bash
npm install -D typescript tsx eslint prettier
```

## Testes

```bash
npm install -D vitest supertest
```

## API REST

```bash
npm install express cors helmet dotenv zod
```

## Tipos

```bash
npm install -D @types/node @types/express @types/cors @types/supertest
```

## Servidor local para frontend estático

```bash
npm install -D http-server
```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

## Scripts sugeridos para `package.json`

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "serve:static": "http-server public -p 8080",
    "check": "npm run build && npm run test"
  }
}
```

---

# 12. Frontend estático

## `public/index.html`

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Automação Multicanal</title>
    <link rel="stylesheet" href="./assets/css/styles.css" />
  </head>
  <body>
    <header class="hero">
      <nav class="nav">
        <strong>AutoContent</strong>
        <a href="#recursos">Recursos</a>
        <a href="#fluxo">Fluxo</a>
        <a href="#precos">Créditos</a>
      </nav>

      <section class="hero-content">
        <h1>Automação com IA para conteúdo, afiliados e canais digitais</h1>
        <p>
          Gere conteúdo, importe produtos, agende publicações e distribua em
          múltiplos canais usando uma operação centralizada.
        </p>
        <button id="startButton">Começar agora</button>
      </section>
    </header>

    <main>
      <section id="recursos" class="grid">
        <article>
          <h2>IA para Conteúdo</h2>
          <p>Gere títulos, descrições, hashtags, reviews, artigos e eBooks.</p>
        </article>

        <article>
          <h2>Produtos Afiliados</h2>
          <p>Importe produtos, normalize dados e gere payloads publicáveis.</p>
        </article>

        <article>
          <h2>Distribuição Multicanal</h2>
          <p>Publique em Telegram, Instagram, WordPress e WooCommerce.</p>
        </article>
      </section>

      <section id="fluxo" class="panel">
        <h2>Fluxo operacional</h2>
        <ol>
          <li>Buscar ou cadastrar produto.</li>
          <li>Gerar conteúdo com IA.</li>
          <li>Revisar e aprovar.</li>
          <li>Agendar publicação.</li>
          <li>Distribuir nos canais conectados.</li>
          <li>Registrar consumo e resultado.</li>
        </ol>
      </section>

      <section id="precos" class="panel">
        <h2>Créditos</h2>
        <p>
          Cada ação consome créditos: geração de conteúdo, envio, publicação ou
          integração externa.
        </p>
      </section>
    </main>

    <script src="./assets/js/app.js"></script>
  </body>
</html>
```

## `public/assets/css/styles.css`

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f7f7fb;
  color: #161616;
}

.hero {
  min-height: 70vh;
  padding: 24px;
  background: linear-gradient(135deg, #111827, #312e81);
  color: white;
}

.nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav a {
  color: white;
  text-decoration: none;
  opacity: 0.85;
}

.hero-content {
  max-width: 760px;
  margin: 96px auto 0;
  text-align: center;
}

.hero-content h1 {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.05;
}

.hero-content p {
  font-size: 1.2rem;
  opacity: 0.9;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 14px 24px;
  font-weight: 700;
  cursor: pointer;
}

main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 48px 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

article,
.panel {
  background: white;
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.panel {
  margin-top: 24px;
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .nav {
    flex-wrap: wrap;
  }
}
```

## `public/assets/js/app.js`

```js
const startButton = document.querySelector("#startButton");

startButton?.addEventListener("click", () => {
  window.location.href = "#recursos";
});
```

---

# 13. Branches GitHub

```bash
git init

git checkout -b main
git add .
git commit -m "chore: initial project setup"

git checkout -b dev
git checkout main

git checkout -b prod
git checkout main

git checkout -b master
git checkout main

git remote add origin <URL_DO_REPOSITORIO>

git push -u origin main
git push -u origin dev
git push -u origin prod
git push -u origin master
```

## Estratégia recomendada

- `main`: branch principal estável.
- `dev`: integração contínua e homologação.
- `prod`: releases de produção.
- `master`: manter apenas se houver compatibilidade legada.

---

# 14. Arquivo `docs/reverse-research.md`

```md
# Pesquisa pública e engenharia reversa limpa

## Produto analisado

Plataforma pública de referência.

## Escopo permitido

Esta pesquisa usa apenas:

- Páginas públicas.
- Documentação oficial de APIs.
- Fluxos observáveis sem autenticação.
- Informações comerciais públicas.

## Funcionalidades públicas observadas

- Geração de conteúdo com IA.
- Artigos, eBooks, reviews, títulos, descrições e hashtags.
- Integração com Shopee afiliado.
- Publicação ou envio para Instagram, Telegram, WordPress e WooCommerce.
- Agendamento.
- Modelo de créditos por uso.
- Login, registro, recuperação de senha e verificação de e-mail.

## Inferências de arquitetura

- API REST central.
- Módulo de créditos.
- Módulo de usuários.
- Módulo de integrações.
- Módulo de agendamento.
- Workers para publicação.
- Ledger para consumo.
- Painel frontend.
- Adapters para providers externos.

## Riscos

- Rate limits das plataformas.
- Mudanças em APIs externas.
- Permissões Meta/Instagram.
- Tokens inválidos de Telegram.
- Credenciais WordPress/WooCommerce incorretas.
- Conteúdo gerado com baixa qualidade.
- Consumo indevido de créditos em falhas parciais.

## Oportunidades

- Construir uma arquitetura própria mais modular.
- Separar publicação manual, agendada e recorrente.
- Criar revisão humana antes da publicação.
- Ter logs e rastreabilidade por ação.
- Ter testes por provider.
```

---

# 15. Arquivo `docs/global-action-plan.md`

```md
# Plano global de ação

## Fase 1 — Fundação técnica

Objetivo: criar a base segura e testável do produto.

Entregáveis:

- API REST TypeScript strict.
- Estrutura de controllers, services e integrations.
- Autenticação base.
- Frontend estático inicial.
- Testes mínimos.
- CI local via `npm run check`.

Critério de saída:

- API sobe localmente.
- Health check responde.
- Testes rodam.
- Estrutura de regras Claude criada.

## Fase 2 — Conta, créditos e ledger

Objetivo: controlar saldo e consumo.

Entregáveis:

- Wallet.
- Ledger.
- Consumo por ação.
- Bloqueio por saldo insuficiente.
- Extrato.

Critério de saída:

- Nenhuma ação paga executa sem saldo.
- Débito é rastreável.
- Falhas não geram cobrança indevida.

## Fase 3 — Conteúdo com IA

Objetivo: gerar conteúdo reutilizável para múltiplos canais.

Entregáveis:

- Geração de título.
- Descrição.
- Hashtags.
- Artigos.
- Reviews.
- Histórico de gerações.

Critério de saída:

- Conteúdo é gerado, salvo e auditável.
- Custo é registrado.
- Falhas são tratadas.

## Fase 4 — Produto afiliado

Objetivo: preparar produtos para publicação.

Entregáveis:

- Busca/importação.
- Normalização de produto.
- Payload publicável.
- Link afiliado.
- Imagens.

Critério de saída:

- Produto pode ser transformado em campanha publicável.

## Fase 5 — Canais

Objetivo: distribuir conteúdo.

Entregáveis:

- Telegram.
- WordPress.
- Instagram/Meta.
- WooCommerce.

Critério de saída:

- Cada canal tem adapter, testes e logs próprios.

## Fase 6 — Agendamento e workers

Objetivo: executar publicações no tempo certo.

Entregáveis:

- Scheduler.
- Fila.
- Retry.
- Estados de publicação.
- Cancelamento.

Critério de saída:

- Publicações são processadas com rastreabilidade.

## Fase 7 — Relatórios e operação

Objetivo: tornar a operação gerenciável.

Entregáveis:

- Dashboard.
- Logs.
- Custos.
- Falhas.
- Histórico de publicações.

Critério de saída:

- Usuário consegue entender o que foi feito, quando, onde, custo e resultado.

## Fase 8 — Deploy dev/prod

Objetivo: publicar com segurança.

Entregáveis:

- Ambiente dev.
- Ambiente prod.
- Variáveis separadas.
- Pipeline de validação.
- Documentação de release.

Critério de saída:

- Dev e prod funcionam de forma separada.
```

---

# 16. Arquivo `docs/phase-todo-plan.md`

```md
# Plano detalhado por fase e funcionalidade

## Fase 1 — Fundação técnica

### API base

- [ ] Criar estrutura de projeto.
- [ ] Ativar TypeScript strict.
- [ ] Criar health check.
- [ ] Criar middleware de erro.
- [ ] Criar validação de ambiente.
- [ ] Criar padrão de resposta de erro.

### Frontend estático

- [ ] Criar `public/index.html`.
- [ ] Criar `public/assets/css/styles.css`.
- [ ] Criar `public/assets/js/app.js`.
- [ ] Criar layout responsivo.
- [ ] Criar CTA inicial.
- [ ] Criar página publicável em hospedagem estática.

### Qualidade

- [ ] Configurar testes.
- [ ] Configurar build.
- [ ] Configurar script `npm run check`.
- [ ] Criar regras Claude.
- [ ] Criar documentação inicial.

## Fase 2 — Conta, créditos e ledger

### Conta

- [ ] Criar cadastro.
- [ ] Criar login.
- [ ] Criar recuperação de senha.
- [ ] Criar verificação de e-mail.
- [ ] Criar sessão ou token.

### Créditos

- [ ] Criar saldo por usuário.
- [ ] Criar ledger.
- [ ] Criar débito.
- [ ] Criar crédito.
- [ ] Criar bloqueio por saldo insuficiente.
- [ ] Criar extrato.

### Testes esperados

- [ ] Deve criar saldo inicial.
- [ ] Deve debitar ação com saldo.
- [ ] Deve bloquear ação sem saldo.
- [ ] Deve registrar extrato.
- [ ] Não deve cobrar em falha transacional.

## Fase 3 — Conteúdo com IA

### Geração

- [ ] Criar adapter de IA.
- [ ] Criar geração de título.
- [ ] Criar geração de descrição.
- [ ] Criar geração de hashtags.
- [ ] Criar geração de artigo.
- [ ] Criar geração de review.
- [ ] Criar histórico.

### Revisão

- [ ] Permitir salvar rascunho.
- [ ] Permitir editar antes de publicar.
- [ ] Permitir aprovar conteúdo.
- [ ] Permitir regenerar conteúdo.

### Testes esperados

- [ ] Deve gerar conteúdo válido.
- [ ] Deve tratar resposta vazia.
- [ ] Deve tratar falha de provider.
- [ ] Deve debitar crédito corretamente.
- [ ] Deve salvar histórico.

## Fase 4 — Produtos afiliados

### Produto

- [ ] Criar entidade de produto.
- [ ] Criar importação.
- [ ] Criar normalização.
- [ ] Criar enriquecimento com IA.
- [ ] Criar link afiliado.
- [ ] Criar payload publicável.

### Testes esperados

- [ ] Deve importar produto válido.
- [ ] Deve rejeitar produto sem dados mínimos.
- [ ] Deve tratar imagem ausente.
- [ ] Deve tratar link ausente.
- [ ] Deve gerar payload para canais.

## Fase 5 — Canais

### Telegram

- [ ] Cadastrar token.
- [ ] Validar token.
- [ ] Cadastrar destino.
- [ ] Enviar mensagem.
- [ ] Enviar imagem.
- [ ] Agendar envio.

### WordPress

- [ ] Cadastrar site.
- [ ] Validar credenciais.
- [ ] Criar post rascunho.
- [ ] Criar post publicado.
- [ ] Criar post agendado.
- [ ] Enviar imagem destacada quando disponível.

### Instagram/Meta

- [ ] Conectar conta via fluxo autorizado.
- [ ] Validar permissões.
- [ ] Validar conta profissional.
- [ ] Criar publicação.
- [ ] Criar legenda e hashtags.
- [ ] Criar regra de resposta automática quando permitido.

### WooCommerce

- [ ] Cadastrar loja.
- [ ] Validar credenciais.
- [ ] Criar produto externo.
- [ ] Enviar imagem.
- [ ] Enviar preço.
- [ ] Enviar link afiliado.

## Fase 6 — Agendamento e workers

### Scheduler

- [ ] Criar agendamento.
- [ ] Cancelar agendamento.
- [ ] Reagendar.
- [ ] Executar no horário.
- [ ] Registrar status.

### Workers

- [ ] Criar fila.
- [ ] Criar retry.
- [ ] Criar dead-letter ou falha final.
- [ ] Criar logs por tentativa.
- [ ] Criar idempotência.

### Testes esperados

- [ ] Deve executar publicação agendada.
- [ ] Deve impedir duplicidade.
- [ ] Deve retry em falha temporária.
- [ ] Deve marcar falha final.
- [ ] Deve registrar histórico.

## Fase 7 — Relatórios

### Operação

- [ ] Mostrar publicações.
- [ ] Mostrar agendamentos.
- [ ] Mostrar falhas.
- [ ] Mostrar consumo.
- [ ] Mostrar saldo.
- [ ] Mostrar custos por canal.

### Exportação

- [ ] Exportar CSV.
- [ ] Filtrar por data.
- [ ] Filtrar por canal.
- [ ] Filtrar por status.

## Fase 8 — Deploy dev/prod

### Dev

- [ ] Criar branch `dev`.
- [ ] Criar variáveis dev.
- [ ] Criar deploy dev.
- [ ] Rodar testes antes do deploy.

### Prod

- [ ] Criar branch `prod`.
- [ ] Criar variáveis prod.
- [ ] Criar deploy prod.
- [ ] Proteger branch de produção.
- [ ] Exigir validação antes de merge.

### Git

- [ ] Criar branch `main`.
- [ ] Criar branch `master`.
- [ ] Criar branch `dev`.
- [ ] Criar branch `prod`.
```

---

# 17. Decisões de organização

## Fica global no `CLAUDE.md`

- Projeto é API REST.
- TypeScript strict.
- Toda funcionalidade deve ser testada.
- Boas práticas REST.
- Segurança de integrações.
- Referência para rules escopadas.

## Vai para rules escopadas

- Controllers: HTTP, DTOs, guards, status codes e contratos.
- Services: regras de negócio, orquestração, transações e integrações.
- Testing: unit, integration, e2e, mocks, sufixos e segmentação de cenários.

## Fica em docs

- Pesquisa pública.
- Arquitetura inferida.
- Plano global.
- Todo-list por fase.
- Decisões de produto.

## Fica fora do escopo

- Acesso ao painel privado da plataforma de referência.
- Captura de endpoints autenticados.
- Cópia de implementação proprietária.
- Automação que viole termos de Meta, Telegram, WordPress, WooCommerce ou Shopee.
