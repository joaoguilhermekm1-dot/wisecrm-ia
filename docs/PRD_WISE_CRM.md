# PRD — Product Requirements Document: WISE CRM IA

## 1. Visão Geral do Produto
O **WISE CRM IA** é um sistema operacional de crescimento (SaaS) voltado para empresas que desejam escalar suas vendas utilizando o "Método Wise" de venda consultiva. O grande diferencial da plataforma é a fusão de um CRM robusto com Inteligência Artificial de elite (Alanis V3), que atua ativamente como uma SDR (Sales Development Representative) em tempo real, analisando comportamentos, definindo perfis (DISC) e sugerindo abordagens humanizadas.

## 2. Objetivos
- **Automatizar e Otimizar a Prospecção:** Minimizar o esforço manual dos SDRs.
- **Venda Consultiva:** Garantir que todas as interações sigam o "Método Wise" (Diagnóstico antes de solução, ancoragem de valor, foco no problema do cliente).
- **Rastreamento de Ponta a Ponta:** Integrar ferramentas de tráfego (Meta Ads, Google Ads) via CAPI (Conversions API) para atribuição multi-touch perfeita.
- **Gestão Visual e Intuitiva:** Proporcionar uma visão clara e customizável do funil de vendas (Kanban) e das automações (MapView).

## 3. Público-Alvo
- **Empresários e Donos de Negócios:** Buscam previsibilidade de vendas e rastreabilidade do ROI de marketing.
- **Gestores Comerciais:** Precisam controlar a produtividade do time e a taxa de conversão do funil.
- **SDRs e Closers:** Necessitam de uma ferramenta rápida, inteligente e centralizada para gerenciar leads e conversas do WhatsApp.

## 4. Funcionalidades Principais (Core Features)

### 4.1. Funil de Vendas (Kanban)
- **Etapas Padrão do Método Wise:**
  1. `NOVO`: Lead entrou via anúncio, WhatsApp ou formulário.
  2. `PROSPECÇÃO`: Contato ativo, primeira abordagem.
  3. `DIAGNÓSTICO`: Entendimento profundo das dores e necessidades.
  4. `FECHAMENTO`: Apresentação de proposta e negociação.
  5. `FECHADO`: Contrato assinado (Ganho).
  6. `FOLLOWUP`: Pós-venda e esteira de fidelização.
- **Customização de Etapas:** Usuário pode adicionar, editar ou excluir colunas. Ao excluir, leads órfãos vão para a primeira coluna.
- **Reset Rápido:** Botão para retornar ao funil padrão Wise.
- **Drag and Drop:** Interface fluida para mover leads entre as etapas.

### 4.2. Caixa de Entrada Inteligente (Inbox / WhatsApp)
- **Integração WhatsApp:** Conexão nativa e espelhamento de conversas (envio de texto, áudio, imagens, vídeos e documentos).
- **UX Premium (WhatsApp Style):** Balões de mensagens coloridos (usuário vs lead), suporte a renderização de todas as mídias.
- **Painel Alanis SDR (IA):**
  - Sugere a resposta exata para a próxima interação baseada no contexto e na metodologia Wise.
  - Exibe o *rationale* (por que aquela resposta foi sugerida).
  - Mostra a próxima ação recomendada.
  - Gera 3 "Outras Abordagens" como alternativas.
- **Perfil Comportamental (DISC):** Identificação contínua do perfil do lead (Dominante, Influente, Estável, Conforme) com base no histórico da conversa.
- **Métricas de Venda:** Cálculo dinâmico de Temperatura e Probabilidade de Fechamento do lead.

### 4.3. Motor de Automação (Flow Engine / MapView)
- **Editor Visual (React Flow):** Canvas drag-and-drop para desenhar fluxos de automação de marketing e vendas.
- **Nós Inteligentes (WiseNodes):**
  - Edição inline (duplo-clique para mudar título e descrição).
  - Toolbar flutuante contextual (Duplicar, Editar, Excluir).
  - Botão rápido para adicionar nós "filhos".
  - Tipos variados: Início, Contato, IA Analisa, Diagnóstico, Proposta, etc.
- **Gerenciamento de Fluxos:** Criação, seleção e salvamento de múltiplos mapas comerciais.

### 4.4. Especialista em Rastreamento (Pixel / CAPI)
- **Skill Agente PIXEL:** Focado em garantir a pureza dos dados.
- **Meta Conversions API Server-Side:** Disparo de eventos de funil diretamente do backend para garantir entrega, mesmo com bloqueadores de anúncios.
- **Webhooks Otimizados:** Recepção e processamento rápido de eventos da Meta e atualização da atribuição de origem (UTM, Referral).

## 5. Arquitetura Técnica

### 5.1. Backend
- **Node.js + Express:** Servidor robusto e assíncrono.
- **Prisma (ORM) + PostgreSQL (Supabase):** Banco de dados relacional e escalável.
- **Socket.io:** WebSockets para atualizações em tempo real (novas mensagens do WhatsApp, atualizações da IA, mudanças no Kanban).
- **IA Integration:** LangChain / Integração direta com LLMs de elite (Anthropic Claude 3.5 Sonnet, Gemini Pro) para o cérebro da Alanis.
- **Baileys:** Biblioteca para conexão com o WhatsApp Web.

### 5.2. Frontend
- **React + Vite:** Alta performance de renderização e build rápido.
- **Tailwind CSS:** Estilização utility-first, garantindo design consistente, moderno e dark-mode nativo.
- **React Flow:** Biblioteca de grafos e nós para a interface do MapView.
- **Lucide React:** Iconografia consistente e leve.

## 6. Diferenciais Estratégicos (A "Wise Magic")
- **Humanização Extrema:** A IA não responde como robô. Os prompts são restritos a respostas curtas, focadas no problema, usando o framework BLOD e imitando a linguagem do dono da empresa.
- **Análise Assíncrona:** A Alanis analisa a conversa em background (sem travar o envio de mensagens do SDR) e emite a sugestão ativamente pelo WebSocket.
- **Visualização CAPI Nível Enterprise:** Dados que normalmente ficam soltos no Meta Ads agora estão atrelados ao CRM real da empresa, mostrando exatamente de qual anúncio veio o faturamento.

## 7. Roadmap Futuro Recomendado
- [ ] Aplicativo Mobile (React Native) para SDRs em campo.
- [ ] Dashboard Analítico Avançado focado em CAC (Custo de Aquisição) e LTV (Life Time Value).
- [ ] Conexão direta com Google Ads via GAQL para espelhamento de custos vs. receita.
- [ ] "Alanis Autopilot": Modo onde a IA não só sugere, mas pode responder o lead automaticamente nas madrugadas.

---
*Gerado por MIND IA / Antigravity - Fase de Implementação V2*
