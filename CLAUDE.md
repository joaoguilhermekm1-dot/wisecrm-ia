---
project: InsightFlow
description: Plataforma SaaS de gestão para Agências de Marketing Social.
---

# CLAUDE.md - Diretrizes de Engenharia (InsightFlow)

Bem-vindo ao córtex central do InsightFlow. Este arquivo dita *COMO* o código deve ser construído, mantido e modificado neste projeto. Nada de amnésia: leia essas diretrizes sempre que modificar algo estrutural.

## 1. Project Conventions & Style Guide
- **Variáveis/Funções:** `camelCase` estrito (ex: `getUserData`).
- **Componentes React/Classes:** `PascalCase` (ex: `MetaCallback`, `DashboardPanel`).
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `MAX_RETRIES`).
- **Nomes de Arquivo:**
  - Frontend (React): `PascalCase.jsx` para componentes e páginas.
  - Backend/Utilitários: `camelCase.js` com sufixo adequado (ex: `user.service.js`, `oauth.routes.js`).
- Prefira **Arrow Functions** e procure manter imutabilidade de estado.

## 2. Tech Stack & Architecture Overview
- **Frontend:** React + Vite + TailwindCSS + Axios + Recharts.
- **Backend:** Node.js + Express.
- **Banco de Dados:** PostgreSQL via Prisma ORM.
- **Serviços Externos (APIs):**
  - Meta Graph API (Facebook Login + Instagram Insights).
  - OpenAI / Anthropic (Para a "Assistente IA Nativa").
  - Evolution API (WhatsApp integração futura).

A arquitetura do Backend é `Routes -> Controllers -> Services`. Os Controladores não devem conter regras de negócio complexas, apenas orquestrar req/res. A regra de negócio mora nos `Services`.

## 3. Testing Requirements & Patterns
- Código deve ser testável. Evite funções de 500 linhas.
- Testes ainda não implementados via Jest/Vitest, porém o código deve seguir separação de responsabilidade para permitir injeção de dependência.

## 4. Git Workflow & Branch Strategy
- Não comite diretamente na `main` quando em produção.
- Use Conventional Commits (`feat: desc`, `fix: desc`).

## 5. Security & Compliance Rules
- **NENHUMA chave API de acesso (secrets), tokens, ou senhas devem ser commitados (hardcoded) no código ou em logs em hipótese alguma.**
- Leia variáveis apenas via `process.env`.
- Todos os Inputs de formulário React devem ser validados antes do envio.

## 6. File Naming & Folder Conventions
### Frontend
- `/src/pages`: Componentes raízes de roteamento (ex: `Dashboard.jsx`).
- `/src/components`: Componentes reutilizáveis de UI (ex: `Button.jsx`, `MetricCard.jsx`).
- `/src/services`: Funções de Axios centralizadas (ex: `api.js`).

### Backend
- `/src/routes`: Definições do Express Router.
- `/src/controllers`: Handlers (req, res).
- `/src/services`: Regras de negócio, fetch p/ APIs (ex: `instagram.service.js`).
- `/src/middlewares`: Tratadores interceptadores (ex: `auth.middleware.js`).

## 7. Review Checklist / Gotchas
- A API Graph do Facebook muda de token de "curta duração" para "longa duração". Sempre processe a troca antes de salvar no DB.
- Os redirecionamentos de OAuth (Callback URI) **devem bater EXATAMENTE** com os listados no Developer Console (ex: `http://localhost:5173/meta-callback`).
- Cuidado ao extrair contas do Meta: O cliente PODE ter um token de Facebook, mas a *Página* dele precisa estar linkada com uma *Conta Instagram Business* previamente via app do Instagram. Caso contrário, a busca vai retornar vazio. Sempre informe esse cenário via try/catch detalhados.
