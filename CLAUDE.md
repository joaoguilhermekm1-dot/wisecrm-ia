---
project: WISE CRM IA
description: Sistema Operacional de Crescimento e CRM p/ Agências, usando IA (Alanis) e Metodologia Wise.
---

# CLAUDE.md - Diretrizes de Engenharia e Memória (WISE CRM IA)

Bem-vindo ao córtex central do WISE CRM IA. Este documento é o **Technical Design Document (TDD)** imutável. Leia sempre antes de agir. Nós seguimos a metodologia **Everything Claude Code (ECC)**.

## 1. Regras de Ouro (ECC & Invariants)
- **Multitenant Obrigatório:** Nenhuma tabela de negócio (`Lead`, `Opportunity`, `Message`) é consultada ou alterada sem injetar o filtro de `companyId`.
- **Micro-Arquivos:** Arquivos com máximo de 200 a 400 linhas. Refatore imediatamente se passar disso.
- **TDD & Clean Architecture:** Nenhum código vai para produção sem teste falho primeiro. A regra de negócio mora puramente em `/src/services` (Backend), e é agnóstica ao framework.
- **Isolamento de Threads (Alanis & Baileys):** O Node.js não pode ser bloqueado pela latência de chamadas à LLM. A API LangChain com Anthropic Claude roda unicamente dentro de workers BullMQ (`aiQueue`).

## 2. BLOD Constraints (Regras de Negócio Inegociáveis)
- O pipeline não é uma agenda, é uma trava de funil. 
- Mutações para avançar no estágio do Kanban falharão (HTTP 400) se a entidade associada não tiver os metadados de diagnóstico preenchidos (dor, cenário, implicação).
- O backend deve expor as 3 métricas vitais para os relatórios:
    1. Agendamento (Novo -> Diagnóstico).
    2. No-Show (Diferença Diagnóstico -> Fechamento).
    3. Taxa de Ganho (Fechamento -> Ganho).

## 3. Tech Stack Autorizada
- **Frontend:** React 18, Vite, TailwindCSS, Zustand (UI/WS State), TanStack React Query (Cache de REST server state), React Flow, `@hello-pangea/dnd`.
- **Backend:** Node.js, Express, Socket.io, BullMQ + Redis, Baileys (WA), LangChain.
- **Data Layer:** PostgreSQL (Supabase), Prisma ORM.

## 4. Dicionário de Estrutura de Pastas (Clean Architecture)
### Backend (`/backend/src/`)
- `/api/routes` & `/api/controllers`: Endpoints REST e Validação (Zod).
- `/services`: Use-cases e lógicas de negócio.
- `/infrastructure`: Adapters para Prisma, BullMQ, Socket.io e Whatsapp Baileys.
- `/workers`: Consumidores de filas assíncronas (`alanis.worker.ts`).

### Frontend (`/frontend/src/`)
- `/features/inbox`: Componentes da Caixa de Entrada e Painel da Alanis.
- `/features/kanban`: Componentes do Pipeline.
- `/lib`: Clientes React Query, Axios.
- `/hooks`: React Hooks genéricos e Sockets.

## 5. Subagent-Driven Development
Quando for executar tarefas grandes, fragmente em planos pequenos e invoque **subagentes** usando a CLI interativa (`claude -p "tarefa"` ou ferramentas associadas) para focar em micro-escopos. O agente principal apenas aprova a qualidade (Code Review) e avança.

## 6. Open Decisions (V1)
- O WhatsApp Web Baileys roda em 1 dispositivo por Agência (sessão compartilhada pelos SDRs).
- O estado das mensagens na tela será gerido via **React Query** (com o socket emitindo invalidateQueries ou `queryClient.setQueryData`).
- A sessão do Baileys será serializada no PostgreSQL (ou num container volume específico dependendo do deploy).
