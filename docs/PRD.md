# PRD — Automações Comerciais Integradas (ACI Suite)

> **Versão:** 2.0
> **Data:** 2025-05-20
> **Autor:** Automações Comerciais Integradas
> **Contato:** contato@automacoescomerciais.com.br

---

## 1. Visão do Produto

Plataforma completa de automação de marketing digital para afiliados, com IA generativa, sistema pay-per-use (créditos pré-pagos) e integrações multicanal. Permite que afiliados de qualquer nível automatizem a publicação de produtos em múltiplas plataformas com conteúdo gerado por IA.

## 2. Problema

Afiliados digitais perdem horas manuais buscando produtos, criando conteúdo, publicando em múltiplas redes e monitorando resultados. Plataformas existentes cobram mensalidades altas e exigem conhecimento técnico avançado.

## 3. Solução

Uma plataforma all-in-one com:
- Busca e importação de produtos de marketplaces (Shopee).
- Geração automática de conteúdo via IA (títulos, descrições, hashtags, artigos).
- Publicação automatizada em Instagram, Telegram, WordPress e WooCommerce.
- Sistema de créditos pay-per-use (paga só o que usa).
- Dashboard com relatórios de desempenho.

## 4. Personas

| Persona | Descrição | Necessidade principal |
|---------|-----------|----------------------|
| Afiliado Iniciante | Pouca experiência, busca simplicidade | Ferramentas simples e tutoriais |
| Afiliado Intermediário | Quer escalar resultados | Automação e integração multicanal |
| Afiliado Profissional | Alta experiência, busca performance | Métricas detalhadas e personalização |

## 5. Funcionalidades Principais

### 5.1 Autenticação e Usuários
- Login/cadastro via email, Google, telefone.
- Perfil com configurações personalizáveis.
- Sistema de créditos por usuário.
- Planos de assinatura com níveis de acesso.

### 5.2 Sistema de Créditos
- Wallet de créditos pré-pagos.
- Ledger de transações (débito/crédito).
- Consumo registrado por ação.
- Bloqueio automático de ação sem saldo.
- Extrato detalhado por período.

### 5.3 IA Generativa
- Provider de IA (OpenAI GPT-4 / Gemini).
- Geração de títulos, descrições, hashtags e artigos completos.
- Custo registrado por geração.
- Histórico de conteúdo gerado.
- Revisão manual antes de publicar.

### 5.4 Produtos Afiliados
- Busca e importação de produtos (Shopee).
- Normalização: nome, imagem, preço, link, categoria.
- Geração de links de afiliados.
- Payload publicável para múltiplos canais.

### 5.5 Canais de Publicação

#### Instagram / Meta
- Conexão via fluxo OAuth autorizado.
- Validação de conta profissional/empresa.
- Publicação com imagem, legenda e hashtags.
- Resposta automática a comentários ("EU QUERO").
- Envio de DM automático.

#### Telegram
- Conexão via token de Bot.
- Cadastro de destinos (grupos/canais).
- Envio de mensagem e imagem.
- Agendamento de envios.

#### WordPress
- Cadastro de site com application password.
- Criação de post como rascunho, futuro ou publicado.
- Envio de título, conteúdo, excerpt, tags e imagem destacada.

#### WooCommerce
- Cadastro de loja com consumer key/secret.
- Criação de produto externo/afiliado.
- Envio de título, descrição, imagem, preço e link externo.
- Criação de reviews com IA.

### 5.6 Relatórios e Analytics
- Ações por canal.
- Custo por ação.
- Falhas e erros.
- Agendamentos ativos.
- Saldo e extrato.
- Exportação CSV.

## 6. Modelo de Negócio

### Tabela de Custos por Ação
| Ação | Custo (R$) |
|------|-----------|
| GPT-4 Turbo | R$ 0,00089/palavra |
| GPT-4 | R$ 0,012/palavra |
| DALL-E 3 | R$ 0,99/imagem |
| Instagram Post | R$ 0,27 |
| Instagram Comentário | R$ 0,09 |
| Instagram DM | R$ 0,09 |
| Telegram | R$ 0,09 |
| Shopee (50 produtos) | R$ 0,09 |
| WordPress Post | R$ 0,27 |
| WooCommerce Produto | R$ 0,27 |
| WooCommerce Review | R$ 0,27 |

## 7. Requisitos Não-Funcionais

- **Performance:** Resposta < 2s para operações comuns.
- **Segurança:** JWT, bcrypt, LGPD, proteção XSS/CSRF.
- **Usabilidade:** Interface responsiva, acessível (WCAG 2.1).
- **Confiabilidade:** 99% uptime, backup automático, logging.

## 8. Restrições

- Dependência de APIs externas (Instagram, Telegram, Shopee).
- Rate limiting nas APIs integradas.
- Conformidade com termos de uso das plataformas.
- Necessidade de conexão estável.

## 9. Métricas de Sucesso

- Tempo médio de publicação multicanal < 30 segundos.
- Taxa de erro em integrações < 2%.
- Satisfação do usuário > 4.5/5.
- Custo médio por publicação completa < R$ 1,00.
