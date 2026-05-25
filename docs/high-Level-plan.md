# Plano de Alto Nível — ACI Suite

> **Versão:** 2.0
> **Data:** 2025-05-20

---

## Visão de Fases

```
Fase 1 ─── Fundação ──────────────────────────── [✅ COMPLETA]
Fase 2 ─── Créditos e Consumo ────────────────── [✅ COMPLETA]
Fase 3 ─── IA Generativa ────────────────────── [✅ COMPLETA]
Fase 4 ─── Produtos Afiliados ────────────────── [🔲 PENDENTE]
Fase 5 ─── Telegram ──────────────────────────── [✅ COMPLETA]
Fase 6 ─── WordPress ─────────────────────────── [✅ COMPLETA]
Fase 7 ─── Instagram / Meta ──────────────────── [✅ COMPLETA]
Fase 8 ─── WooCommerce ───────────────────────── [✅ COMPLETA]
Fase 9 ─── Relatórios e Analytics ────────────── [🔲 PENDENTE]
Fase 10 ── Deploy dev/prod ───────────────────── [🔲 PENDENTE]
```

---

## Fase 1 — Fundação `[✅ COMPLETA]`

**Objetivo:** Infraestrutura base do projeto.

**Entregas:**
- TypeScript strict mode configurado
- API REST base (Express)
- Estrutura controllers → services → integrations
- Autenticação JWT + bcrypt
- CRUD de usuários
- Variáveis de ambiente (.env)
- Frontend React/Vite
- Supabase como banco de dados

**Critérios de saída:**
- API respondendo corretamente
- Login/cadastro funcional
- Testes de saúde passando

---

## Fase 2 — Créditos e Consumo `[✅ COMPLETA]`

**Objetivo:** Sistema pay-per-use funcional.

**Entregas:**
- Wallet de créditos por usuário
- Ledger de transações (débito/crédito)
- Consumo registrado por ação
- Bloqueio automático sem saldo
- Extrato por período
- Pagamento via PIX (Mercado Pago)

**Dependências:** Fase 1

**Critérios de saída:**
- Compra de créditos funcional
- Débito automático por ação
- Extrato exibindo corretamente

---

## Fase 3 — IA Generativa `[✅ COMPLETA]`

**Objetivo:** Geração de conteúdo automatizada.

**Entregas:**
- Provider OpenAI (GPT-4 / GPT-4 Turbo)
- Provider Gemini
- Geração de títulos, descrições, hashtags
- Geração de artigos para blog
- Custo registrado por geração
- Histórico de conteúdo
- Chat com IA

**Dependências:** Fase 2 (para débito de créditos)

**Critérios de saída:**
- Conteúdo gerado com qualidade
- Custo debitado corretamente
- Histórico acessível

---

## Fase 4 — Produtos Afiliados `[🔲 PENDENTE]`

**Objetivo:** Busca e importação de produtos de marketplaces.

**Entregas:**
- Adapter de busca (Shopee)
- Normalização: nome, imagem, preço, link, categoria
- Geração de link de afiliado
- Payload publicável para múltiplos canais
- Filtros e busca avançada

**Dependências:** Fase 1

**Trilha paralela:** Pode rodar em paralelo com Fases 5-8.

**Critérios de saída:**
- Busca retornando produtos normalizados
- Link de afiliado funcional
- Payload pronto para publicação

---

## Fase 5 — Telegram `[✅ COMPLETA]`

**Objetivo:** Automação de envio via Telegram Bot.

**Entregas:**
- Conexão via token de bot
- Validação de bot
- Cadastro de destinos (grupos/canais)
- Envio de mensagem e imagem
- Página de configuração

**Dependências:** Fase 1, Fase 2

**Critérios de saída:**
- Bot conectado e validado
- Mensagens entregues com sucesso

---

## Fase 6 — WordPress `[✅ COMPLETA]`

**Objetivo:** Publicação automática em blogs WordPress.

**Entregas:**
- Cadastro de site com application password
- CRUD de posts (draft, future, publish)
- Envio com título, conteúdo, excerpt, tags, imagem
- Gerenciamento de categorias e tags
- Upload de mídia
- Helper para posts de afiliados

**Dependências:** Fase 1, Fase 2

**Critérios de saída:**
- Posts publicados com sucesso em WordPress externo
- Imagens enviadas corretamente

---

## Fase 7 — Instagram / Meta `[✅ COMPLETA]`

**Objetivo:** Publicação e automação via Instagram Graph API.

**Entregas:**
- Conexão OAuth via Facebook
- Validação de conta profissional/empresa
- Publicação com imagem, legenda e hashtags
- Resposta automática a comentários ("EU QUERO")
- Envio de DM automático
- Listagem de posts recentes

**Dependências:** Fase 1, Fase 2

**Critérios de saída:**
- Fluxo OAuth completo
- Posts publicados com sucesso
- Auto-reply funcional

---

## Fase 8 — WooCommerce `[✅ COMPLETA]`

**Objetivo:** Criação de produtos afiliados em lojas WooCommerce.

**Entregas:**
- Cadastro de loja com consumer key/secret
- Criação de produto externo/afiliado
- Envio com título, descrição, imagem, preço, link externo
- Criação de reviews com IA
- Gerenciamento de categorias

**Dependências:** Fase 1, Fase 2

**Critérios de saída:**
- Produtos criados em loja WooCommerce externa
- Reviews publicadas com sucesso

---

## Fase 9 — Relatórios e Analytics `[🔲 PENDENTE]`

**Objetivo:** Dashboard de métricas e relatórios.

**Entregas:**
- Ações por canal
- Custo por ação
- Falhas e erros
- Agendamentos ativos
- Saldo e extrato
- Exportação CSV
- Gráficos de performance

**Dependências:** Fases 1-8 (dados de uso)

**Critérios de saída:**
- Dashboard exibindo métricas corretas
- Exportação CSV funcional
- Filtros por período e canal

---

## Fase 10 — Deploy dev/prod `[🔲 PENDENTE]`

**Objetivo:** Pipeline de deploy automatizado.

**Entregas:**
- Ambiente dev configurado
- Ambiente prod configurado
- Variáveis de ambiente separadas
- Testes obrigatórios antes do deploy
- Frontend estático publicado
- API publicada
- Monitoramento de logs

**Dependências:** Todas as fases anteriores

**Critérios de saída:**
- Deploy automatizado funcional
- Logs acessíveis
- Rollback possível

---

## Diagrama de Dependências

```
Fase 1 (Fundação)
├──> Fase 2 (Créditos)
│    ├──> Fase 3 (IA)
│    ├──> Fase 5 (Telegram)
│    ├──> Fase 6 (WordPress)
│    ├──> Fase 7 (Instagram)
│    └──> Fase 8 (WooCommerce)
├──> Fase 4 (Afiliados) ── paralela
└──> Fase 9 (Relatórios) ── depende de dados de uso
     └──> Fase 10 (Deploy) ── final
```

## Trilhas Paralelas

| Trilha | Fases | Observação |
|--------|-------|------------|
| Core | 1 → 2 → 3 | Sequencial obrigatório |
| Canais | 5, 6, 7, 8 | Paralelas entre si, dependem de 1+2 |
| Afiliados | 4 | Independente, paralela com canais |
| Observabilidade | 9 → 10 | Finais, dependem de dados |
