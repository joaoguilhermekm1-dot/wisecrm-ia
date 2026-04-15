const Anthropic = require('@anthropic-ai/sdk');

class IntelligenceService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Pipeline Principal de Decisão Comercial (Orquestrador)
   */
  async processCommercialPipeline(leadId, messageContent, history = []) {
    try {
      // 1. Agente Analista
      const analysis = await this.agentAnalyst(messageContent, history);
      
      // 2. Extrator de Memória Emocional
      // Na vida real puxaríamos a leadMemory do DB, aqui simulamos o consolidado
      const behaviorTags = analysis.resumo;

      // 3. Agente Copy (O Melhor SDR do Mundo)
      const copy = await this.agentCopy(messageContent, analysis, history);
      
      // 4. Agente Estrategista (Próximo Passo)
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
   * Objetivo: Extrair dados estruturados e intenção.
   */
  async agentAnalyst(message, history = []) {
    const historyText = history.slice(-5).map(h => `${h.sender}: ${h.content}`).join('\n');
    
    const prompt = `
Você é o Analista Comportamental de Elite do melhor time de Vendas do Mundo.
Sua tarefa é extrair padrões de comportamento humano, intenção de compra, e gatilhos emocionais da conversa.

CONTEXTO RECENTE:
${historyText}

MENSAGEM ATUAL DO LEAD:
"${message}"

TAREFA:
Analise profundamente o perfil psicológico e a intenção, retorne estritamente em JSON:
1. intencao: (curiosidade, interesse, compra, dúvida, objeção, barganha)
2. temperatura: (frio, morno, quente) - use "quente" apenas se houver urgência de compra ou agendamento.
3. consciencia: (baixo, médio, alto) - nível de entendimento do lead sobre o próprio problema.
4. probabilidade: (0 a 100) - chance real de fechamento.
5. resumo: (Resumo tático profundo do momento do lead, focando nas dores e motivações ocultas).

RETORNO JSON:
{
  "intencao": "",
  "temperatura": "",
  "consciencia": "",
  "probabilidade": 0,
  "resumo": ""
}
`;

    const res = await this.callAI(prompt);
    return res;
  }

  /**
   * AGENTE 2: COPY / RESPOSTA
   * Objetivo: Gerar resposta natural orientada a vendas.
   */
  async agentCopy(message, analysis, history = []) {
    const prompt = `
Você é o MELHOR SDR (Sales Development Representative) DO MUNDO. 
Você domina perfeitamente:
- Psicologia e Comportamento Humano aplicado a vendas.
- Rapport extremo, empatia táctica e comunicação não violenta (Modelo de comunicação de Vendas Humanizadas).
- Engenharia de propostas, frameworks SPIN Selling e BANT.

Você não soa como um robô, IA ou "Vendedor Padrão". Você é hipnótico, natural, elegante e cirúrgico.
Seu objetivo é: Aquecer o lead, desarmar objeções, adaptar 100% o seu tom de voz à vibe da conversa do Lead e criar uma conexão profunda que o guie para o fechamento ou agendamento de forma natural.

DADOS DE MEMÓRIA E ANÁLISE HUMANA DO LEAD:
Intenção: ${analysis.intencao}
Temperatura: ${analysis.temperatura}
Comportamento/Dores Identificadas: ${analysis.resumo}

MENSAGEM DO LEAD:
"${message}"

REGRAS ESTritas:
1. Comunicação 100% humanizada (use palavras do dia a dia, evite jargões corporativos robóticos).
2. Espelhe a energia emocional e o comprimento do lead (mas de forma otimista e direcionada).
3. Entenda qual é a Dúvida ou Objeção oculta dele e desarme de forma elegante.
4. Finalize com AQUELA pergunta engajadora e irrecusável.

RETORNO JSON:
{
  "response": "texto da resposta aqui"
}
`;

    const res = await this.callAI(prompt);
    return res;
  }

  /**
   * AGENTE 3: ESTRATEGISTA
   * Objetivo: Definir o próximo passo comercial.
   */
  async agentStrategist(analysis, history = []) {
    const prompt = `
Você é o Estrategista Comercial Chefe da Wise Company.
Baseado na análise do lead, defina a melhor estratégia de acompanhamento.

DADOS DO LEAD:
${JSON.stringify(analysis, null, 2)}

TAREFA:
Defina o próximo passo ideal seguindo a regra:
- Quente -> Ação Imediata (Fechar/Agendar).
- Morno -> Nutrir com prova social ou valor.
- Frio -> Educar ou apenas manter no radar.

RETORNO JSON:
{
  "proxima_acao": "ex: responder, enviar oferta, follow-up, aguardar",
  "tempo_acao": "ex: imediato, 10min, 1h, 24h",
  "objetivo": "ex: avançar venda, quebrar objeção, engajar",
  "sugestao_estrategica": "texto curto do que o vendedor deve fazer"
}
`;

    const res = await this.callAI(prompt);
    return res;
  }

  /**
   * Helper para chamadas ao Claude
   */
  async callAI(prompt) {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (err) {
      console.error('[Intelligence Agent Call] Error:', err.message);
      
      // Fallback gracioso caso os créditos da API acabem ou limite seja atingido
      return {
        intencao: "Desconhecida",
        temperatura: "Frio",
        consciencia: "Baixo",
        probabilidade: 0,
        resumo: "Lead sem análise profunda da IA de pré-vendas.",
        response: "Sistema de triagem recebendo alta carga, processamento rápido desativado.",
        proxima_acao: "Verificacao Manual",
        tempo_acao: "24h",
        objetivo: "Aguardar retorno e agir manualmente",
        sugestao_estrategica: "Rever a mensagem do lead manualmente e enviar proposta.",
        diagnostico_erro: "Os dados coletados neste momento necessitam de revisão humana da diretoria.",
        solucao_rapida: "Entrar em contato ativamente com a base de leads parados.",
        plano_acao: "Assumir controle da esteira operacional desta semana.",
        follow_up_message: "Olá! Gostaria de saber se ainda possui interesse nos nossos serviços.",
        reasoning: "Fallback ativado provisoriamente devido à indisponibilidade momentânea do agente."
      };
    }
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
