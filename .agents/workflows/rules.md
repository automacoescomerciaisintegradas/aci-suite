---
description: Arquiteto de Automação Multicanal
---

Módulos para implementar em ordem

Fase 1 — Fundação
Inicializar TypeScript strict.
Criar API REST base.
Criar estrutura controllers, services, integrations.
Criar autenticação.
Criar usuários.
Criar configuração de ambiente.
Criar testes mínimos de saúde.
Criar frontend estático inicial.
Fase 2 — Créditos e consumo
Criar wallet de créditos.
Criar ledger de transações.
Registrar consumo por ação.
Bloquear ação sem saldo.
Criar extrato.
Criar testes de saldo insuficiente, débito e rollback.
Fase 3 — IA
Criar provider de IA.
Gerar título, descrição, hashtags e artigos.
Registrar custo por geração.
Salvar histórico.
Permitir revisão manual antes de publicar.
Testar falha de provider, conteúdo vazio e custo.
Fase 4 — Produtos afiliados
Criar adapter para busca/importação de produtos.
Normalizar produto: nome, imagem, preço, link, categoria.
Criar payload publicável.
Testar filtros, produto inválido e ausência de link.
Fase 5 — Telegram
Conectar token de bot.
Validar bot.
Cadastrar destinos.
Enviar mensagem e imagem.
Agendar envios.
Testar token inválido, destino inválido, rate limit e sucesso.
Fase 6 — WordPress
Cadastrar site WordPress.
Configurar autenticação.
Criar post como rascunho, futuro ou publicado.
Enviar título, conteúdo, excerpt, tags e imagem destacada quando disponível.
Testar draft, publish, falha de autenticação e payload inválido.
Fase 7 — Instagram/Meta
Implementar conexão via fluxo autorizado.
Validar conta profissional/empresa.
Criar publicação com imagem, legenda e hashtags.
Implementar resposta automática reativa a comentários autorizados.
Testar permissões ausentes, conta não elegível e erro de publicação.
Fase 8 — WooCommerce
Cadastrar loja.
Criar produto externo/afiliado.
Enviar título, descrição, imagem, preço e link externo.
Testar credenciais, payload inválido e duplicidade.
Fase 9 — Relatórios
Mostrar ações por canal.
Mostrar custo por ação.
Mostrar falhas.
Mostrar agendamentos.
Mostrar saldo.
Exportar CSV.
Fase 10 — Deploy dev/prod
Criar ambiente dev.
Criar ambiente prod.
Separar variáveis.
Rodar testes antes do deploy.
Publicar frontend estático.
Publicar API.
Monitorar logs.