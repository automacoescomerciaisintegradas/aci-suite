# Checklist Funcional por Fase — ACI Suite

> **Versão:** 2.0
> **Data:** 2025-05-20

---

## Fase 4 — Produtos Afiliados `[🔲 PRÓXIMA]`

### Busca e importação
- [ ] Criar adapter de busca para Shopee
- [ ] Implementar busca por termo com paginação
- [ ] Implementar filtros por preço, categoria, relevância
- [ ] Tratar timeout e falha na API Shopee

### Normalização
- [ ] Normalizar produto: nome, imagem, preço, link, categoria
- [ ] Validar campos obrigatórios
- [ ] Tratar produto com dados incompletos
- [ ] Gerar link de afiliado automaticamente

### Payload publicável
- [ ] Gerar payload formatado para Instagram
- [ ] Gerar payload formatado para Telegram
- [ ] Gerar payload formatado para WordPress
- [ ] Gerar payload formatado para WooCommerce

### Testes
- [ ] Busca retorna lista normalizada
- [ ] Filtros funcionam corretamente
- [ ] Produto inválido é rejeitado com mensagem clara
- [ ] Ausência de link afiliado é tratada
- [ ] Timeout de API tratado com retry

### Documentação
- [ ] Documentar endpoints de busca
- [ ] Documentar formato do payload publicável
- [ ] Documentar fluxo de link de afiliado

**Pré-requisitos:** Fase 1 completa.
**Critério de pronto:** Busca funcional, normalização completa, payload pronto para qualquer canal.

---

## Fase 9 — Relatórios e Analytics `[🔲 PENDENTE]`

### Dashboard de métricas
- [ ] Exibir total de ações por canal (Instagram, Telegram, WordPress, WooCommerce)
- [ ] Exibir custo acumulado por canal
- [ ] Exibir custo por ação individual
- [ ] Exibir gráfico de ações por período (dia, semana, mês)

### Falhas e erros
- [ ] Listar falhas de envio com timestamp e contexto
- [ ] Filtrar falhas por canal e período
- [ ] Exibir taxa de erro por canal

### Agendamentos
- [ ] Listar agendamentos ativos
- [ ] Exibir próximo envio programado
- [ ] Permitir cancelar agendamento

### Saldo
- [ ] Exibir saldo atual de créditos
- [ ] Exibir extrato com filtros por período e tipo
- [ ] Exibir gasto médio diário

### Exportação
- [ ] Exportar relatório de ações como CSV
- [ ] Exportar extrato de créditos como CSV
- [ ] Exportar relatório de falhas como CSV

### Testes
- [ ] Dashboard exibe dados corretos
- [ ] Filtros por período funcionam
- [ ] CSV exportado contém todos os campos
- [ ] Dashboard com zero dados não quebra
- [ ] Gráfico com dados parciais renderiza corretamente

### Documentação
- [ ] Documentar endpoints de relatório
- [ ] Documentar formato do CSV exportado

**Pré-requisitos:** Fases 1-8 completas (dados de uso).
**Critério de pronto:** Dashboard funcional com dados reais, exportação CSV testada.

---

## Fase 10 — Deploy dev/prod `[🔲 PENDENTE]`

### Ambientes
- [ ] Configurar ambiente dev (branch `dev`)
- [ ] Configurar ambiente prod (branch `main` ou `prod`)
- [ ] Separar variáveis de ambiente dev/prod
- [ ] Validar que nenhuma variável de prod vaza em dev

### Pipeline de deploy
- [ ] Rodar lint antes do deploy
- [ ] Rodar testes antes do deploy
- [ ] Build do frontend (Vite)
- [ ] Build do backend (tsc)
- [ ] Deploy do frontend (estático)
- [ ] Deploy da API

### Monitoramento
- [ ] Configurar logging estruturado
- [ ] Logs acessíveis em produção
- [ ] Alertas de erro crítico
- [ ] Healthcheck endpoint

### Segurança de deploy
- [ ] Prod só recebe código que passou nos testes
- [ ] Rollback possível em < 5 minutos
- [ ] Secrets não commitados no repositório
- [ ] CORS configurado por ambiente

### Testes
- [ ] Deploy em dev funciona end-to-end
- [ ] Deploy em prod funciona end-to-end
- [ ] Healthcheck responde corretamente
- [ ] Rollback funciona

### Documentação
- [ ] Documentar variáveis de ambiente necessárias
- [ ] Documentar processo de deploy
- [ ] Documentar processo de rollback

**Pré-requisitos:** Todas as fases anteriores.
**Critério de pronto:** Pipeline automatizado, deploy funcional em ambos ambientes, logs acessíveis.

---

## Fases Concluídas (Referência)

### Fase 1 — Fundação `[✅]`
- [x] TypeScript strict mode
- [x] API REST Express
- [x] Controllers/services/integrations
- [x] Autenticação JWT + bcrypt
- [x] CRUD de usuários
- [x] Configuração de ambiente
- [x] Frontend React/Vite
- [x] Supabase configurado

### Fase 2 — Créditos `[✅]`
- [x] Wallet de créditos
- [x] Ledger de transações
- [x] Consumo por ação
- [x] Bloqueio sem saldo
- [x] Extrato
- [x] PIX (Mercado Pago)

### Fase 3 — IA `[✅]`
- [x] Provider OpenAI
- [x] Provider Gemini
- [x] Geração de conteúdo
- [x] Custo por geração
- [x] Histórico
- [x] Chat com IA

### Fase 5 — Telegram `[✅]`
- [x] Conexão via token
- [x] Validação de bot
- [x] Cadastro de destinos
- [x] Envio de mensagem/imagem

### Fase 6 — WordPress `[✅]`
- [x] Cadastro de site
- [x] Autenticação
- [x] CRUD de posts
- [x] Categorias/tags
- [x] Upload de mídia

### Fase 7 — Instagram `[✅]`
- [x] OAuth Facebook
- [x] Conta profissional
- [x] Publicação com imagem
- [x] Auto-reply
- [x] DM automático

### Fase 8 — WooCommerce `[✅]`
- [x] Cadastro de loja
- [x] Produto externo
- [x] Imagem/preço/link
- [x] Reviews com IA
