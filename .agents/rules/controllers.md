---
trigger: "controllers|routes|endpoint|http|request|response|status.code|middleware"
---

# Regras de Controllers — ACI Suite

## Escopo

Estas regras se aplicam a todos os arquivos em `src/backend/routes/` e quaisquer futuros controllers.

## Estrutura de um Controller

```typescript
// src/backend/routes/{recurso}.ts
import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/{recurso} — Listar
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  // 1. Extrair e validar parâmetros
  // 2. Chamar service
  // 3. Retornar resposta padronizada
});

export default router;
```

## Princípios

1. **Controllers são finos.** Apenas:
   - Extraem dados do request (params, query, body, headers).
   - Validam shape do input (DTO).
   - Chamam o service correspondente.
   - Formatam e retornam a resposta HTTP.

2. **Sem lógica de negócio.** Nunca calcule, transforme dados, acesse banco ou chame APIs externas diretamente no controller.

3. **Validação de input no controller.** Use validação de DTO antes de chamar o service. Se o input for inválido, retorne `400 Bad Request` imediatamente.

4. **Status codes corretos:**
   - `200` — Sucesso (GET, PUT, PATCH)
   - `201` — Recurso criado (POST)
   - `204` — Sem conteúdo (DELETE)
   - `400` — Input inválido
   - `401` — Não autenticado
   - `403` — Não autorizado
   - `404` — Recurso não encontrado
   - `409` — Conflito
   - `422` — Entidade não processável
   - `429` — Rate limit
   - `500` — Erro interno

5. **Resposta padronizada:**
   ```typescript
   // Sucesso
   res.status(200).json({ success: true, data: resultado });
   
   // Erro
   res.status(400).json({ success: false, error: 'Mensagem clara' });
   ```

6. **Auth guard no controller.** Middlewares de autenticação e autorização devem ser aplicados nas rotas, não nos services.

7. **Try/catch em toda rota.** Capturar erros e retornar resposta adequada, nunca deixar exceções vazarem.

## Convenções de Rota

- `GET /api/{recurso}` — Listar
- `GET /api/{recurso}/:id` — Detalhe
- `POST /api/{recurso}` — Criar
- `PUT /api/{recurso}/:id` — Atualizar (completo)
- `PATCH /api/{recurso}/:id` — Atualizar (parcial)
- `DELETE /api/{recurso}/:id` — Remover

## Contratos HTTP

- Sempre documentar request body, query params e response no código.
- Usar tipos TypeScript para todos os contratos.
- Nunca retornar dados sensíveis (senhas, tokens internos).
