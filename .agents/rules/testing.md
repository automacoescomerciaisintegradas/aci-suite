---
trigger: "test|spec|jest|vitest|mock|assert|expect|coverage|e2e|integration.test"
---

# Regras de Testes — ACI Suite

## Escopo

Estas regras se aplicam a todos os testes do projeto: unitários, integração e e2e.

## Estratégia de Testes

### Pirâmide de Testes

```
         /  e2e  \          ← Poucos, lentos, alto valor
        / integração \      ← Médios, validam contratos
       /   unitários   \    ← Muitos, rápidos, isolados
```

### Cobertura Mínima por Módulo

| Camada | Cobertura mínima | Tipo principal |
|--------|-----------------|----------------|
| Services | 80% | Unitário |
| Controllers | 70% | Integração |
| Integrations | 60% | Integração + mock |
| Utils | 90% | Unitário |

## Convenções de Arquivo

```
src/
├── services/
│   ├── creditService.ts
│   └── __tests__/
│       └── creditService.test.ts
├── backend/
│   ├── routes/
│   │   ├── instagram.ts
│   │   └── __tests__/
│   │       └── instagram.test.ts
```

- Testes ficam em `__tests__/` adjacente ao módulo.
- Nome do arquivo: `{módulo}.test.ts` ou `{módulo}.spec.ts`.

## Convenções de Nomenclatura

```typescript
describe('CreditService', () => {
  describe('debitar', () => {
    it('deve debitar créditos quando saldo suficiente', async () => { ... });
    it('deve lançar erro quando saldo insuficiente', async () => { ... });
    it('deve registrar transação no ledger', async () => { ... });
    it('deve fazer rollback se a ação falhar', async () => { ... });
  });
});
```

- `describe` — Nome da classe ou módulo.
- `describe` interno — Nome do método.
- `it` — Cenário específico, começando com "deve".

## Cenários Obrigatórios por Tipo

### Controllers (Integração)
- [ ] Status 200/201 no caminho feliz.
- [ ] Status 400 com input inválido.
- [ ] Status 401 sem autenticação.
- [ ] Status 404 para recurso inexistente.
- [ ] Status 500 quando service lança erro.
- [ ] Response body no formato padrão `{ success, data/error }`.

### Services (Unitário)
- [ ] Caminho feliz — retorna resultado esperado.
- [ ] Input inválido — lança erro tipado.
- [ ] Falha de dependência — trata corretamente.
- [ ] Edge cases — valores limite, listas vazias, null.

### Créditos (Cenários críticos)
- [ ] Débito com saldo suficiente → sucesso.
- [ ] Débito com saldo insuficiente → erro + sem débito.
- [ ] Rollback após falha na ação → crédito restaurado.
- [ ] Transação registrada no ledger.
- [ ] Extrato reflete débitos e créditos.

### Integrations (Mock de API)
- [ ] Resposta bem-sucedida da API externa.
- [ ] API externa retorna erro (400, 401, 500).
- [ ] Timeout da API externa.
- [ ] Rate limiting (429).
- [ ] Token inválido ou expirado.

## Boundaries de Mock

| Camada | O que mockar |
|--------|-------------|
| Service | Database, integrations, providers externos |
| Controller | Service inteiro |
| Integration | HTTP client (fetch/axios) |

**Nunca mockar:** Lógica interna do módulo sendo testado.

## Data Setup

- Usar factories para criar dados de teste.
- Nunca depender de estado externo (banco real, API real).
- Limpar estado entre testes (`beforeEach` / `afterEach`).

## Validação de Contratos HTTP

```typescript
// Testar o formato exato da resposta
expect(response.status).toBe(200);
expect(response.body).toEqual({
  success: true,
  data: expect.objectContaining({
    id: expect.any(String),
    // ...
  }),
});
```

## Comandos

```bash
# Rodar todos os testes
npm test

# Rodar com cobertura
npm test -- --coverage

# Rodar testes de um módulo
npm test -- --testPathPattern=creditService
```
