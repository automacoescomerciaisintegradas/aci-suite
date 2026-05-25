# Plano de Ação Global — ACI Suite

> **Versão:** 2.0
> **Data:** 2025-05-20

---

## Resumo Estratégico

O ACI Suite é uma plataforma de automação multicanal para afiliados digitais. O plano global organiza o desenvolvimento em 10 fases com dependências claras, critérios de saída e trilhas paralelas.

**Status geral:** 7 de 10 fases completas (70%)

---

## Fases, Marcos e Dependências

### Fase 1 — Fundação `[✅ COMPLETA]`

**Marco:** API REST funcional com autenticação.

| Item | Status |
|------|--------|
| TypeScript strict mode | ✅ |
| API REST Express | ✅ |
| Estrutura controllers/services/integrations | ✅ |
| Autenticação JWT + bcrypt | ✅ |
| CRUD de usuários | ✅ |
| Configuração de ambiente (.env) | ✅ |
| Frontend React/Vite | ✅ |
| Supabase configurado | ✅ |

---

### Fase 2 — Créditos e Consumo `[✅ COMPLETA]`

**Marco:** Sistema pay-per-use funcional com pagamento PIX.

| Item | Status |
|------|--------|
| Wallet de créditos | ✅ |
| Ledger de transações | ✅ |
| Consumo por ação | ✅ |
| Bloqueio sem saldo | ✅ |
| Extrato | ✅ |
| Pagamento PIX (Mercado Pago) | ✅ |

---

### Fase 3 — IA Generativa `[✅ COMPLETA]`

**Marco:** Geração de conteúdo com débito automático.

| Item | Status |
|------|--------|
| Provider OpenAI (GPT-4) | ✅ |
| Provider Gemini | ✅ |
| Geração de títulos/descrições/hashtags | ✅ |
| Geração de artigos | ✅ |
| Custo por geração | ✅ |
| Histórico | ✅ |
| Chat com IA | ✅ |

---

### Fase 4 — Produtos Afiliados `[🔲 PENDENTE]`

**Marco:** Busca e normalização de produtos Shopee.

| Item | Status | Prioridade |
|------|--------|-----------|
| Adapter de busca Shopee | 🔲 | Alta |
| Normalização de produto | 🔲 | Alta |
| Geração de link afiliado | 🔲 | Alta |
| Payload publicável | 🔲 | Média |
| Filtros e busca avançada | 🔲 | Média |

**Dependência:** Fase 1
**Trilha:** Paralela — pode rodar em paralelo com Fases 5-8.

**Critérios de aceite:**
- Busca retorna produtos normalizados com nome, imagem, preço, link, categoria.
- Link de afiliado é gerado automaticamente.
- Payload está pronto para envio a qualquer canal.
- Testes cobrem: filtros, produto inválido, ausência de link.

---

### Fase 5 — Telegram `[✅ COMPLETA]`

**Marco:** Bot conectado e enviando mensagens.

| Item | Status |
|------|--------|
| Conexão via token | ✅ |
| Validação de bot | ✅ |
| Cadastro de destinos | ✅ |
| Envio de mensagem/imagem | ✅ |
| Página de configuração | ✅ |

---

### Fase 6 — WordPress `[✅ COMPLETA]`

**Marco:** Posts publicados em WordPress externo.

| Item | Status |
|------|--------|
| Cadastro de site | ✅ |
| Autenticação (application password) | ✅ |
| CRUD de posts | ✅ |
| Gerenciamento de categorias/tags | ✅ |
| Upload de mídia | ✅ |
| Helper para posts afiliados | ✅ |

---

### Fase 7 — Instagram / Meta `[✅ COMPLETA]`

**Marco:** Publicação e auto-reply funcional.

| Item | Status |
|------|--------|
| OAuth via Facebook | ✅ |
| Validação conta profissional | ✅ |
| Publicação com imagem | ✅ |
| Auto-reply a comentários | ✅ |
| Envio de DM | ✅ |

---

### Fase 8 — WooCommerce `[✅ COMPLETA]`

**Marco:** Produtos afiliados criados em loja externa.

| Item | Status |
|------|--------|
| Cadastro de loja | ✅ |
| Produto externo/afiliado | ✅ |
| Envio com imagem/preço/link | ✅ |
| Reviews com IA | ✅ |

---

### Fase 9 — Relatórios e Analytics `[🔲 PENDENTE]`

**Marco:** Dashboard com métricas e exportação.

| Item | Status | Prioridade |
|------|--------|-----------|
| Ações por canal | 🔲 | Alta |
| Custo por ação | 🔲 | Alta |
| Falhas e erros | 🔲 | Alta |
| Agendamentos | 🔲 | Média |
| Saldo e extrato | 🔲 | Alta |
| Exportar CSV | 🔲 | Média |
| Gráficos de performance | 🔲 | Baixa |

**Dependência:** Fases 1-8 (dados de uso)

**Critérios de aceite:**
- Dashboard exibe dados reais de uso por canal.
- Custo por ação calculado corretamente.
- Falhas e erros listados com timestamp e contexto.
- Exportação CSV funcional.

---

### Fase 10 — Deploy dev/prod `[🔲 PENDENTE]`

**Marco:** Pipeline de deploy automatizado.

| Item | Status | Prioridade |
|------|--------|-----------|
| Ambiente dev | 🔲 | Alta |
| Ambiente prod | 🔲 | Alta |
| Variáveis separadas | 🔲 | Alta |
| Testes antes do deploy | 🔲 | Alta |
| Frontend estático publicado | 🔲 | Média |
| API publicada | 🔲 | Alta |
| Monitoramento de logs | 🔲 | Média |

**Dependência:** Todas as fases anteriores.

**Critérios de aceite:**
- Deploy automatizado funcional.
- Variáveis dev e prod isoladas.
- Testes obrigatórios antes de promoção.
- Logs acessíveis e monitoráveis.
- Rollback possível em < 5 minutos.

---

## Decisões Explícitas

| Decisão | Justificativa |
|---------|---------------|
| Frontend React/Vite (não estático puro) | Projeto já evoluiu com componentes TSX |
| Supabase como banco de dados | Já configurado e em uso |
| PIX via Mercado Pago | Integração já implementada |
| Gemini como provider secundário de IA | Custo menor para operações de alto volume |
| Agendamento adiado para Fase 9 | Depende de fila/cron ainda não implementados |

## Riscos Identificados

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Rate limiting das APIs externas | Falhas de envio | Retry com backoff exponencial |
| Mudanças na API do Instagram/Meta | Quebra de funcionalidade | Adapter pattern, versionamento |
| Shopee pode restringir API afiliado | Fase 4 bloqueada | Prever adapter alternativo |
| Custo de IA pode subir | Impacto no modelo de negócio | Provider duplo (GPT-4 + Gemini) |
