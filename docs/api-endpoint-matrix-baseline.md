# Matriz de Endpoints — Baseline Fase 0

Data da coleta: 21/05/2026  
Backend canônico alvo da migração: **Express** (`src/backend/server.ts`)

## Legenda
- `✅` Implementado
- `⚠️` Implementado com divergência de contrato
- `❌` Não implementado

## 1) Endpoints consumidos pelo frontend (clientes API)
Fontes de consumo principais:
- `src/services/apiClient.ts`
- `services/universalApiClient.ts`
- componentes com `fetch('/api/...')`

| Método | Endpoint consumido | Express | Worker (`src/index.ts`) | Observação |
|---|---|---|---|---|
| POST | `/api/auth/signup` | ✅ | ✅ | Alinhado |
| POST | `/api/auth/login` | ✅ | ✅ | Alinhado |
| GET | `/api/auth/user` | ❌ | ✅ | Falta no Express |
| PUT | `/api/auth/profile` | ❌ | ✅ | Falta no Express |
| POST | `/api/auth/forgot-password` | ✅ | ✅ | Alinhado |
| POST | `/api/auth/validate-reset-token` | ✅ | ❌ | Worker usa `/api/auth/verify-reset-token` |
| POST | `/api/auth/reset-password` | ✅ | ✅ | Alinhado |
| POST | `/api/settings` | ✅ | ❌ | Só Express |
| GET | `/api/settings/me` | ✅ | ❌ | Só Express |
| GET | `/api/credits/balance` | ⚠️ | ✅ | Express usa `req.user`; frontend envia `userId` |
| GET | `/api/credits/transactions` | ❌ | ✅ | Falta no Express |
| GET | `/api/packages` | ❌ | ✅ | Express expõe `/api/payments/packages` |
| GET | `/api/wordpress/connections` | ❌ | ✅ | No Express o módulo ativo é `/api/blogs` |
| POST | `/api/wordpress/connection` | ❌ | ✅ | No Express o fluxo equivalente está em `/api/blogs` |
| GET | `/api/keys` | ❌ | ✅ | Falta no Express |
| POST | `/api/keys` | ❌ | ✅ | Falta no Express |
| POST | `/api/avatar/upload` | ❌ | ✅ | Falta no Express |
| GET | `/api/avatar/:id` | ❌ | ✅ | Falta no Express |
| GET | `/api/sessions` | ❌ | ✅ | Falta no Express |
| POST | `/api/sessions` | ❌ | ✅ | Falta no Express |
| PUT | `/api/sessions/activity` | ❌ | ✅ | Falta no Express |
| PUT | `/api/sessions/end` | ❌ | ✅ | Falta no Express |
| GET | `/api/health` | ❌ | ✅ | Express expõe `/health` |
| POST | `/api/payments/create-pix` | ✅ | ❌ | Só Express |
| GET | `/api/payments/status/:paymentId` | ✅ | ❌ | Só Express |
| POST | `/api/payments/process_payment` | ✅ | ❌ | Só Express |
| GET | `/api/payments/packages` | ✅ | ❌ | Só Express |
| POST | `/api/integrations/woocommerce/validate` | ✅ | ❌ | Só Express |
| GET | `/api/integrations/instagram/auth` | ✅ | ✅ | Alinhado |

## 2) Endpoints consumidos diretamente por componentes

| Método | Endpoint consumido | Express | Worker | Observação |
|---|---|---|---|---|
| GET | `/api/blogs` | ✅ | ❌ | Só Express |
| POST | `/api/blogs/validate` | ✅ | ❌ | Só Express |
| POST | `/api/blogs` | ✅ | ❌ | Só Express |
| DELETE | `/api/blogs?id=...` | ✅ | ❌ | Só Express |
| POST | `/api/blogs/:id/test` | ✅ | ❌ | Só Express |
| POST | `/api/blogs/:id/publish` | ✅ | ❌ | Só Express |
| POST | `/api/content/generate` | ❌ | ❌ | Existe rota em arquivo, mas não está montada no Express |
| GET | `/api/metrics/performance` | ❌ | ❌ | Endpoint comentado no Express |
| GET | `/api/metrics/cache` | ✅ | ❌ | Só Express |
| POST | `/api/integrations/telegram/configure` | ❌ | ❌ | Existe em `src/api`, não montado no backend ativo |
| POST | `/api/automation/webhook/:id` | ❌ | ❌ | Não implementado |
| GET/POST/PUT/DELETE | `/api/payment-methods*` | ❌ | ❌ | TODO explícito no frontend |

## 3) Endpoints já expostos no Express e pouco/sem consumo no frontend

| Método | Endpoint Express | Situação |
|---|---|---|
| GET | `/api/shopee/resolve` | Uso indireto via `geminiService` |
| POST | `/api/actions/generate` | Endpoint técnico com `costGuard` |
| GET | `/api/facebook/test` | Endpoint de diagnóstico/manual |
| GET/POST/DELETE | `/api/instagram-browser/*` | Fluxo especializado (automation browser) |

## 4) Gaps críticos para início da Fase 1

1. Consolidar no Express os endpoints hoje atendidos apenas no Worker e consumidos pelo frontend:
- `/api/auth/user`, `/api/auth/profile`
- `/api/credits/transactions`
- `/api/packages` (ou alinhar cliente para `/api/payments/packages`)
- `/api/keys`, `/api/avatar/*`, `/api/sessions/*`
- `/api/health` (alias para `/health`)

2. Montar ou remover contratos pendentes:
- Montar `/api/content/generate` no `server.ts` ou retirar consumo atual.
- Definir destino oficial para Telegram (`/api/integrations/telegram/*`).
- Tratar endpoints TODO de payment methods e automation webhook.

3. Eliminar ambiguidade WordPress:
- Padronizar em `/api/blogs/*` **ou** restaurar `/api/wordpress/*`, sem duplicidade semântica.

## 5) Decisão operacional para a migração
Até a conclusão da Fase 3, toda feature nova deve:
- Implementar primeiro no **Express canônico**.
- Entrar na matriz acima antes de merge.
- Incluir teste de integração do endpoint novo/alterado.

