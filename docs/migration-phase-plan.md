# Plano de Migração em Fases — Arquitetura ACI Suite

Data de referência: 21 de maio de 2026

## 1. Objetivo
Unificar a arquitetura do ACI Suite em uma linha única de execução, removendo duplicidades entre camadas, garantindo persistência real de dados, contratos REST consistentes e operação estável para frontend + automações.

## 2. Estado Atual (resumo técnico)
- Frontend React/Vite com chamadas para `/api/*`.
- Backend principal em Express (`src/backend/server.ts` + `src/backend/routes/*`).
- Backend alternativo legado em Cloudflare Worker (`src/index.ts`) com contratos sobrepostos.
- Persistência heterogênea:
- Prisma com incompatibilidades de geração/configuração.
- Serviços em memória (ex.: `simpleCreditService`, `userSettingsService`).
- Camada de compatibilidade “Supabase” mockada.
- Endpoints consumidos no frontend que não existem no backend Express atual.

## 3. Princípios da Migração
- Um backend canônico por ambiente (Express como canônico nesta migração).
- Contrato API versionado e publicado antes do corte.
- Sem big-bang: migração por fatia funcional.
- Cada fase com critérios de aceite e rollback explícitos.
- Observabilidade mínima obrigatória antes de corte em produção.

## 4. Roadmap em Fases

## Fase 0 — Congelamento e Baseline (1-2 dias)
Objetivo: parar crescimento da dívida durante a migração.

Escopo:
- Congelar criação de novos endpoints fora do backend canônico.
- Catalogar todos os endpoints:
- Frontend consumindo.
- Express servindo.
- Worker servindo.
- Publicar matriz de compatibilidade `consumido x implementado`.

Critérios de aceite:
- Inventário completo e validado pelo time.
- Lista de gaps priorizada por impacto (Auth, Billing, Integrations).

Rollback:
- Não aplicável (fase de diagnóstico/gestão).

## Fase 1 — Definição de Backend Canônico e Contrato Único (2-3 dias)
Objetivo: definir e formalizar “fonte da verdade” da API.

Escopo:
- Confirmar Express como backend canônico.
- Marcar Worker como legado/deprecado (sem novos recursos).
- Criar especificação OpenAPI inicial (`/api/*`) para os fluxos críticos:
- Auth.
- Credits/Billing.
- Payments.
- Integrations (Instagram, WordPress, WooCommerce, Telegram).
- Publicar política de versionamento (ex.: `/api/v1` lógico mesmo mantendo caminhos atuais).

Critérios de aceite:
- Documento de contrato único aprovado.
- Toda nova implementação referenciando OpenAPI.

Rollback:
- Reverter apenas documentação/flags de depreciação.

## Fase 2 — Persistência Única e Saneamento de Dados (4-7 dias)
Objetivo: eliminar estado em memória para domínios críticos.

Escopo:
- Corrigir stack de persistência escolhida (Prisma + PostgreSQL ou D1, sem híbrido ambíguo).
- Ajustar `prisma/schema.prisma` e geração de client em versão compatível.
- Migrar `simpleCreditService` e `userSettingsService` para repositórios persistentes.
- Definir padrão de repositório por domínio:
- `AuthRepository`.
- `CreditsRepository`.
- `SettingsRepository`.
- Remover fallback em memória para produção.

Critérios de aceite:
- Reinício do backend não perde saldo/configurações.
- Fluxos de login, saldo e settings persistem entre sessões.

Rollback:
- Feature flag para fallback temporário em memória apenas em dev.

## Fase 3 — Normalização de Endpoints Críticos (5-8 dias)
Objetivo: alinhar o que frontend chama com o que backend realmente expõe.

Escopo:
- Auth:
- Garantir `login`, `signup`, `forgot-password`, `validate-reset-token`, `reset-password`.
- Credits/Billing:
- `balance`, `transactions`, `packages`, recarga PIX e webhook.
- Settings:
- consolidar em `/api/settings` e `/api/settings/me`.
- Integrations:
- garantir rotas usadas na UI para Instagram/WordPress/WooCommerce/Telegram.
- Tratar endpoints órfãos:
- `apiClient/universalApiClient` apontando para rotas inexistentes.

Critérios de aceite:
- Matriz “consumido x implementado” sem gaps nos fluxos críticos.
- Testes de integração verdes para os endpoints críticos.

Rollback:
- Manter aliases temporários de rota por 1 ciclo de release.

## Fase 4 — Módulos de Canais e Publicação (6-10 dias)
Objetivo: consolidar integrações externas com semântica única.

Escopo:
- Instagram/Meta:
- OAuth, callback, publicação e status de conta.
- WordPress:
- conexões, validação, publicação e teste.
- WooCommerce:
- validação e operações suportadas de catálogo/review.
- Telegram:
- configuração e envio mínimo funcional.
- Padronizar tratamento de erro, timeout e retry por integração.

Critérios de aceite:
- Cada canal com “happy path” e “erro esperado” cobertos por teste.
- Status de conexão refletido corretamente na Central de Integrações.

Rollback:
- Desativação por provider via feature flag sem derrubar plataforma inteira.

## Fase 5 — Scheduler, Fila e Retentativa Real (4-7 dias)
Objetivo: substituir cron/placeholders por processamento confiável.

Escopo:
- Implementar tabela/fila de jobs persistente.
- Estados de job: `pending`, `running`, `retrying`, `failed`, `completed`.
- Retentativa com backoff e limite.
- Idempotência por chave de operação.
- Endpoint de consulta de status de agendamento/publicação.

Critérios de aceite:
- Jobs sobrevivem restart do servidor.
- Retentativa controlada e auditável.

Rollback:
- Reprocessamento manual de jobs em fallback.

## Fase 6 — Reporting e Observabilidade (3-5 dias)
Objetivo: tornar operação mensurável.

Escopo:
- Eventos de domínio:
- autenticação, consumo de créditos, publicação, falha por canal.
- Dashboard mínimo de métricas:
- sucesso/falha por integração.
- custo por ação.
- latência por endpoint.
- Logs estruturados com correlação por request/job.

Critérios de aceite:
- Incidente reproduzível via logs + trilha de eventos.
- Métricas básicas acessíveis para operação.

Rollback:
- Manter logs legados paralelos até estabilização.

## Fase 7 — Hardening e Go-Live (3-6 dias)
Objetivo: fechar migração com segurança de release.

Escopo:
- Testes:
- unitários por serviço crítico.
- integração para rotas principais.
- smoke e2e de login + integração + publicação.
- Segurança:
- revisão de CORS, secrets, exposição de tokens.
- Deploy:
- pipeline dev -> prod com gates de qualidade.
- Plano de desativação do Worker legado.

Critérios de aceite:
- Checklist de release 100% aprovado.
- SLO mínimo definido e monitorado após go-live.

Rollback:
- Versão anterior do backend canônico + feature flags de corte de integração.

## 5. Ordem de Prioridade (execução)
1. Fase 0 e 1 (contrato e governança).
2. Fase 2 (persistência única).
3. Fase 3 (contratos críticos funcionando).
4. Fase 4 (integrações completas).
5. Fase 5 (agendamento robusto).
6. Fase 6 e 7 (observabilidade + hardening + go-live).

## 6. Riscos Principais e Mitigação
- Divergência de contratos entre frontend e backend.
- Mitigação: OpenAPI + testes de contrato.
- Perda de estado por uso de memória.
- Mitigação: migração prioritária de credits/settings para DB.
- Instabilidade de integrações externas.
- Mitigação: timeout, retry e isolamento por provider.
- Regressão em produção durante corte.
- Mitigação: feature flags + rollout gradual + rollback versionado.

## 7. Entregáveis por Fase
- Fase 0: inventário completo de endpoints e gaps.
- Fase 1: contrato OpenAPI e decisão arquitetural oficial.
- Fase 2: persistência consolidada sem estado crítico em memória.
- Fase 3: fluxos críticos ponta a ponta funcionando.
- Fase 4: canais operacionais com testes.
- Fase 5: scheduler/filas com idempotência.
- Fase 6: métricas e logs acionáveis.
- Fase 7: release estável com plano de rollback testado.

