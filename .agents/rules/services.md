---
trigger: "service|business.logic|integration|provider|wallet|ledger|credit|transaction"
---

# Regras de Services — ACI Suite

## Escopo

Estas regras se aplicam a todos os arquivos em `services/` e `src/services/`.

## Estrutura de um Service

```typescript
// services/{recurso}Service.ts

export class RecursoService {
  // Dependências injetadas via construtor
  constructor(
    private readonly db: DatabaseClient,
    private readonly provider?: ExternalProvider
  ) {}

  // Métodos públicos = operações de negócio
  async criar(input: CriarDTO): Promise<Recurso> { ... }
  async buscar(id: string): Promise<Recurso | null> { ... }
  async atualizar(id: string, input: AtualizarDTO): Promise<Recurso> { ... }
  async remover(id: string): Promise<void> { ... }
}
```

## Princípios

1. **Services contêm a lógica de negócio.** Validações de domínio, cálculos, regras de negócio e orquestração vivem aqui.

2. **Sem acesso direto ao request/response HTTP.** Services recebem dados tipados e retornam dados tipados. Nunca importar Express.

3. **Orquestração de efeitos colaterais.** Quando uma ação envolve múltiplos passos (ex: publicar post + debitar crédito + registrar log), o service coordena.

4. **Transações.** Operações que envolvem múltiplas escritas devem ser atômicas. Se uma falha, todas revertem.

5. **Débito de créditos:**
   - Verificar saldo antes da ação.
   - Debitar no início da operação.
   - Reverter (rollback) se a ação falhar.
   - Registrar no ledger com tipo da ação e custo.

6. **Integrations separadas.** Chamadas a APIs externas devem ficar em modules de integration (ex: `src/lib/instagram.ts`, `src/lib/wordpress.ts`), nunca diretamente no service.

7. **Retries e fallbacks.** Para chamadas externas que podem falhar:
   - Retry com backoff exponencial.
   - Fallback para provider alternativo quando disponível.
   - Log do erro com contexto.

8. **Rate limiting.** Respeitar os limites das APIs externas. Implementar filas quando necessário.

9. **Idempotência.** Operações que podem ser chamadas múltiplas vezes devem produzir o mesmo resultado. Usar chaves de idempotência quando necessário.

## Convenções de Nomes

- `{recurso}Service.ts` — Nome do arquivo.
- `criar`, `buscar`, `atualizar`, `remover` — Verbos em português para métodos CRUD.
- `publicar`, `agendar`, `gerar`, `enviar` — Verbos de ação para operações de negócio.
- Erros de domínio devem ter mensagens claras e descritivas.

## Integrations vs Services

| Camada | Responsabilidade |
|--------|------------------|
| Service | Lógica de negócio, orquestração, transações |
| Integration | Comunicação com APIs externas, normalização de resposta |
| Repository | Acesso a banco de dados |

## Tratamento de Erros

- Lançar erros tipados com código e mensagem.
- Nunca engolir erros silenciosamente.
- Logar erros com contexto (userId, ação, input).
- Retornar mensagens amigáveis para o controller formatar.
