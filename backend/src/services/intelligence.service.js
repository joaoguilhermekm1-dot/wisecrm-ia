const aiOrchestrator = require('./ai_orchestrator.service');

class IntelligenceService {
  /**
   * Pipeline Principal de Decisão Comercial (Orquestrador)
   */
  async processCommercialPipeline(leadId, messageContent, history = []) {
    try {
      // 1. Agente Analista
      const analysis = await this.agentAnalyst(messageContent, history);
      
      // 2. Agente Copy (O Melhor SDR do Mundo)
      const copy = await this.agentCopy(messageContent, analysis, history);
      
      // 3. Agente Estrategista (Próximo Passo)
      const strategy = await this.agentStrategist(analysis, history);

      return {
        analysis,
        suggestedResponse: copy.response,
        strategy,
        timestamp: new Date()
      };
    } catch (err) {
      console.error('[IA Engine] Erro no pipeline:', err);
      throw err;
    }
  }

  /**
   * AGENTE 1: ANALISTA DE LEAD
   */
  async agentAnalyst(message, history = []) {
    const historyText = history.slice(-5).map(h => `${h.sender}: ${h.content}`).join('\n');
    
    const prompt = `Você é o Analista Comportamental de Elite do melhor time de Vendas do Mundo.
Extraia padrões de comportamento humano, intenção de compra, e gatilhos emocionais.

CONTEXTO RECENTE:
${historyText}

MENSAGEM ATUAL DO LEAD:
"${message}"

RETORNE JSON:
{
  "intencao": "(curiosidade, interesse, compra, dúvida, objeção, barganha)",
  "temperatura": "(frio, morno, quente)",
  "consciencia": "(baixo, médio, alto)",
  "probabilidade": 0,
  "resumo": "..."
}`;

    return await aiOrchestrator.call(prompt, "Aja como um Analista de Leads de Alto Nível.");
  }

  /**
   * AGENTE 2: COPY / RESPOSTA
   */
  async agentCopy(message, analysis, history = []) {
    const prompt = `Você é o MELHOR SDR DO MUNDO. 
DADOS DE ANÁLISE:
Intenção: ${analysis.intencao}
MENSAGEM DO LEAD: "${message}"

Crie uma resposta humanizada, hipnótica e elegante que guie o lead para o fechamento.
RETORNE JSON: { "response": "..." }`;

    return await aiOrchestrator.call(prompt, "Você é Alanis, a SDR mestre da Wise Company.");
  }

  /**
   * AGENTE 3: ESTRATEGISTA
   */
  async agentStrategist(analysis, history = []) {
    const prompt = `Você é o Estrategista Comercial Chefe.
DADOS DO LEAD: ${JSON.stringify(analysis)}

Defina o próximo passo comercial ideal.
RETORNE JSON:
{
  "proxima_acao": "...",
  "tempo_acao": "...",
  "objetivo": "...",
  "sugestao_estrategica": "..."
}`;

    return await aiOrchestrator.call(prompt, "Aja como Diretor Comercial C-Level.");
  }

  async callAI(prompt) {
    // Legado: mantido apenas para compatibilidade temporária se necessário
    return await aiOrchestrator.call(prompt);
  }

  /**
   * AGENTE ESTRATÉGICO DE KPI (Métricas Globais)
   */
  async agentAnalytics(data) {
    const prompt = `
Você é o Estrategista KPI da Wise Company, especialista em Vendas e Conversão.
Dados Analíticos Atuais:
- Total Leads: ${data.totalLeads}
- Fechados: ${data.fechados}
- Taxa de Resposta (estimada): ${data.taxaResposta}%
- Média Temperatura: ${data.avgTemp}% (0 a 100)
- Quentes: ${data.leadsQuentes}
- Perdidos: ${data.perdidos}

Analise os dados comerciais acima e diga:
1. O que está errado (um ponto crítico)
2. O que melhorar (rápido ganho)
3. Próximas ações práticas

Retorne JSON:
{
  "diagnostico_erro": "...",
  "solucao_rapida": "...",
  "plano_acao": "..."
}
`;
    return await this.callAI(prompt);
  }

  /**
   * AGENTE 4: ESPECIALISTA EM MARKETING E TRÁFEGO PAGO
   * Contexto do user no Marketing Hub (Comportamento, Dados Meta Ads, Copywriting, Branding, Vendas).
   */
  async agentMarketingStrategist(insights, recentChatHistory = []) {
    const chatContext = recentChatHistory.length > 0 
      ? recentChatHistory.map(m => `${m.sender}: ${m.content}`).join('\n')
      : "Nenhum contexto prévio de conversa.";

    const prompt = `
Você é um Estrategista de Marketing e Tráfego Pago Master de Elite (Nível C-Level, Top Player do Mercado).
Sua especialidade vai muito além do gerenciamento de anúncios: você entende de comportamento humano aplicado ao consumo, Branding (Posicionamento Premium), Vendas Omnichannel, Copywriting (gatilhos e persuasão) e Análise Crítica de Dados.

O USUÁRIO (SEU CLIENTE) está na dashboard Meta Ads e enviou uma dúvida ou estamos iniciando.
Os dados da campanha e performance atuais dele (Resumo Meta Ads) são:
${JSON.stringify(insights?.primaryMetrics || {}, null, 2)}
Gastos Totais: ${(insights?.funnel?.spend || 0).toFixed(2)}
Alcance: ${insights?.funnel?.reach || 0}
Top Campanhas (se houver): ${JSON.stringify((insights?.campaigns || []).slice(0, 2), null, 2)}

MENSAGENS ANTERIORES DO CHAT COM O USUÁRIO:
${chatContext}

TAREFA:
Se não houver última mensagem do usuário (início do chat), gere 3 sugestões iniciais customizadas e uma mensagem de abertura calorosa focada na jornada dele e nos números dele (Ex: Por que seu CTR está baixo?). Se ele houver perguntado algo, responda de forma consultiva, pragmática, e genial.

Responda no formato JSON restrito.
RETORNO JSON (Se for início ou resposta):
{
  "mensagem": "Sua resposta estratégica super densa, inteligente, didática e de alto impacto de negócios...",
  "sugestoes": ["Sugestão de pergunta/ação 1", "Sugestão 2", "Sugestão 3"]
}
`;
    return await this.callAI(prompt);
  }

  /**
   * MÉTODO PÚBLICO: Sugestão Comercial para o Controller de Marketing
   */
  async getMarketingSuggestion(insights, contextMessages = []) {
    return await this.agentMarketingStrategist(insights, contextMessages);
  }

  /**
   * MÉTODO PÚBLICO: Sugestão Comercial para o Controller de Leads
   * Usado em getAISuggestion para gerar resposta com base no histórico de msgs.
   */
  async getCommercialSuggestion(leadId, messages = []) {
    // Formatar histórico para o pipeline
    const history = messages.map(m => ({
      sender: m.sender === 'user' ? 'Vendedor' : 'Lead',
      content: m.content
    }));

    const lastLeadMessage = messages
      .filter(m => m.sender === 'lead')
      .slice(-1)[0]?.content || 'Primeiro contato.';

    return await this.processCommercialPipeline(leadId, lastLeadMessage, history);
  }
}

module.exports = new IntelligenceService();
