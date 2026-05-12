const prisma = require('../lib/prisma');
const aiOrchestrator = require('./ai_orchestrator.service');

/**
 * ═══════════════════════════════════════════════════════════════
 *  ALANIS V3 — SDR ELITE DA WISE COMPANY
 *  DNA: Método Wise de Venda Consultiva + DISC + Blood Flow Model
 *  Missão: Gerar conversas 100% humanizadas, sem robôs, com conexão real.
 *  Filosofia: "Gerar curiosidade → Diagnosticar → Conduzir → Fechar"
 * ═══════════════════════════════════════════════════════════════
 */
class SDRService {

  /**
   * AGENTE 1: PROFILER DISC
   * Mapeia o perfil comportamental do lead para personalizar a comunicação.
   * D = Dominante (direto, resultados), I = Influente (relação, energia),
   * S = Estável (segurança, processo), C = Consciente (dados, análise)
   */
  async agentProfiler(messages, lead) {
    const history = messages.slice(-12).map(m =>
      `[${m.sender === 'user' ? 'VENDEDOR' : 'LEAD'}]: ${m.content}`
    ).join('\n');

    const prompt = `Você é um especialista em comportamento humano e perfil DISC.
Analise esta conversa de vendas e extraia o perfil comportamental do lead "${lead.name}".

HISTÓRICO DA CONVERSA:
${history}

CONTEXTO DO LEAD:
- Status no funil: ${lead.status || 'NOVO'}
- Temperatura atual: ${lead.temperature || 0}%
- Número de interações: ${lead.memory?.interactions || 0}
- Perfil DISC anterior: ${lead.memory?.disc || 'Não mapeado ainda'}

Analise a FORMA como o lead escreve (palavras usadas, ritmo, emoção, objetividade) para definir:
- **D (Dominante):** Fala direto, quer resultado, sem rodeios, impaciente
- **I (Influente):** Amigável, emotivo, gosta de conversa, usa emojis, entusiasta
- **S (Estável):** Cauteloso, pede garantias, quer processo claro, evita riscos
- **C (Consciente):** Analítico, pede dados e provas, compara, faz perguntas técnicas

RETORNE APENAS JSON VÁLIDO:
{
  "disc": "D|I|S|C",
  "disc_confidence": 0-100,
  "communication_style": "como falar com esse lead: tom, ritmo, palavras-chave",
  "pain_signals": ["dor 1 identificada", "dor 2"],
  "buying_stage": "curiosidade|interesse|consideração|decisão",
  "objections_predicted": ["possível objeção 1"],
  "emotional_state": "empolgado|ansioso|desconfiante|neutro|pronto para comprar",
  "summary": "Resumo tático de uma linha sobre esse lead"
}`;

    return await aiOrchestrator.call(prompt, 'Você é um especialista em psicologia comportamental aplicada a vendas. Seja preciso e cirúrgico.');
  }

  /**
   * AGENTE 2: ALANIS — A MELHOR SDR DO BRASIL
   * Gera a mensagem ideal: humanizada, contextualizada, com intenção comercial.
   * Baseada no Método Wise de Venda Consultiva.
   */
  async agentSDR(lead, currentMessage, profile, recentMessages) {
    const conversationSummary = recentMessages
      .slice(-8)
      .map(m => `${m.sender === 'user' ? 'Eu' : lead.name}: ${m.content}`)
      .join('\n');

    const disc = profile?.disc || 'I';
    const toneGuide = {
      'D': 'Seja direta, objetiva, focada em resultado. Sem blá-blá-blá. Vá ao ponto.',
      'I': 'Seja calorosa, entusiasmada, use o nome da pessoa, crie conexão emocional.',
      'S': 'Seja tranquila, segura, mostre processo. Evite pressão. Dê garantias.',
      'C': 'Seja racional, cite dados se tiver, explique o "por quê", seja precisa.'
    };

    const stageAction = {
      'NOVO': 'Objetivo: gerar curiosidade e rapport. NÃO tente vender ainda.',
      'CONTATO FEITO': 'Objetivo: qualificar o lead com 1 pergunta estratégica sobre a dor dele.',
      'DIAGNÓSTICO': 'Objetivo: aprofundar o diagnóstico. Use o método Wise: "O que você já tentou que não funcionou?"',
      'PROPOSTA ENVIADA': 'Objetivo: garantir que a proposta foi vista e abrir espaço para dúvidas.',
      'NEGOCIAÇÃO': 'Objetivo: ancorar o valor. Nunca defenda preço atacando concorrente. Reconstrua a percepção de valor.',
      'FECHADO': 'Objetivo: reforçar a decisão, celebrar e alinhar próximos passos do onboarding.',
      'FOLLOWUP': 'Objetivo: manter o relacionamento ativo. Entregue um insight de valor.',
      'PERDIDO': 'Objetivo: manter a porta aberta com educação. Plantar semente para o futuro.'
    };

    const prompt = `Você é ALANIS — a melhor SDR do Brasil. Você trabalha para a Wise Company.

FILOSOFIA WISE DE VENDA CONSULTIVA:
- Diagnóstico antes de solução (nunca apresente proposta sem ouvir a fundo)
- Perguntas antes de preço
- Conduz estrategicamente — não empurra, não convence, CONDUZ
- Frases modelo: "O que te impediria de fecharmos hoje?", "O que você já tentou que não funcionou?", "Se continuasse como está, como estaria daqui a um ano?"

CONVERSA RECENTE:
${conversationSummary}

ÚLTIMA MENSAGEM DO LEAD:
"${currentMessage}"

PERFIL DO LEAD "${lead.name}":
- Perfil DISC: ${disc} — ${toneGuide[disc] || toneGuide['I']}
- Estado emocional: ${profile?.emotional_state || 'neutro'}
- Dores identificadas: ${(profile?.pain_signals || []).join(', ') || 'nenhuma ainda'}
- Etapa no funil: ${lead.status || 'NOVO'}
- ${stageAction[lead.status] || stageAction['NOVO']}

REGRAS DE OURO (NUNCA QUEBRE):
1. JAMAIS use linguagem de robô ou vendedor de telemarketing
2. JAMAIS comece a mensagem com "Olá!" ou "Olá, [Nome]!" genérico
3. JAMAIS use frases feitas como "Fico feliz em ajudar" ou "Com certeza!"
4. A mensagem deve soar como se o JOÃO (dono da Wise) estivesse escrevendo pessoalmente
5. Use o nome do lead NO MÁXIMO 1 vez e apenas se fizer sentido natural
6. Seja específico ao contexto — referencie algo que o lead disse
7. Máximo 3 linhas. Mensagens curtas convertem mais no WhatsApp.
8. Se o lead fez uma pergunta, responda-a ANTES de avançar com a próxima jogada comercial
9. Crie abertura para a resposta (não feche a conversa)

RETORNE APENAS JSON VÁLIDO:
{
  "response": "a mensagem que Alanis enviaria — natural, humana, direta ao contexto",
  "rationale": "por que essa mensagem foi escolhida (1 linha para o SDR entender a estratégia)",
  "next_action": "qual deve ser o próximo passo comercial após esta mensagem",
  "urgency_level": "baixa|média|alta",
  "followup_trigger": "em quantos dias fazer follow-up se não houver resposta (ex: 2 dias)"
}`;

    return await aiOrchestrator.call(
      prompt,
      'Você é Alanis, a SDR mais humanizada e estratégica do Brasil. Sua missão é criar conexão real e conduzir o lead ao fechamento com elegância.'
    );
  }

  /**
   * AGENTE 3: ANALISTA EM TEMPO REAL
   * Gera análise recorrente da conversa e 3 sugestões de abordagem distintas.
   * Executado de forma assíncrona para não bloquear o fluxo principal.
   */
  async agentRealtimeAnalyst(lead, messages, profile) {
    const history = messages.slice(-10).map(m =>
      `[${m.sender === 'user' ? 'SDR' : lead.name}]: ${m.content}`
    ).join('\n');

    const prompt = `Você é o Analista Comercial em Tempo Real da Wise Company.

Analise ESTA conversa agora e gere 3 sugestões de mensagem distintas para o SDR enviar.
As mensagens devem ser diferentes em abordagem (ex: uma mais direta, uma mais empática, uma com pergunta estratégica).

CONVERSA:
${history}

PERFIL DO LEAD:
- Nome: ${lead.name}
- DISC: ${profile?.disc || 'I'}
- Temperatura: ${lead.temperature || 0}%
- Status: ${lead.status || 'NOVO'}
- Dores identificadas: ${(profile?.pain_signals || []).join(', ') || 'A mapear'}

REGRAS DAS SUGESTÕES:
- Cada uma deve ser COMPLETAMENTE diferente em tom e abordagem
- Máximo 3 linhas cada
- 100% humanizadas — sem linguagem robótica
- Baseadas no contexto específico desta conversa (não genéricas)
- Seguir o Método Wise: conduzir, não empurrar

RETORNE APENAS JSON VÁLIDO:
{
  "temperatura_atual": 0-100,
  "intencao_compra": "curiosidade|interesse|consideração|decisão|objeção",
  "risco_perda": "baixo|médio|alto",
  "diagnostico_rapido": "1 frase sobre onde essa conversa está agora",
  "sugestoes": [
    { "tipo": "Direta", "mensagem": "...", "por_que": "..." },
    { "tipo": "Empática", "mensagem": "...", "por_que": "..." },
    { "tipo": "Pergunta Estratégica", "mensagem": "...", "por_que": "..." }
  ],
  "alerta": "algum sinal de alerta ou oportunidade que o SDR deve notar agora"
}`;

    return await aiOrchestrator.call(
      prompt,
      'Você é um Analista Comercial de elite. Sua análise é cirúrgica, rápida e acionável.'
    );
  }

  /**
   * PIPELINE PRINCIPAL — Orquestração com DNA Wise Company
   */
  async processMessage(leadId, currentMessage, messages = []) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          memory: true,
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20
          }
        }
      });

      if (!lead) throw new Error('Lead não encontrado');
      const userId = lead.ownerId;
      const recentMessages = messages.length > 0 ? messages : lead.messages;

      // 1. Profiler primeiro (precisa para SDR)
      const profile = await this.agentProfiler(recentMessages, lead);

      // 2. SDR Alanis com perfil injetado
      const sdrResponse = await this.agentSDR(lead, currentMessage, profile, recentMessages);

      // 3. Analista em tempo real (async, não bloqueia)
      this.agentRealtimeAnalyst(lead, recentMessages, profile)
        .then(analysis => {
          this.updateLeadMemory(leadId, profile, analysis, lead.memory);
        })
        .catch(err => console.error('[Realtime Analyst Error]', err.message));

      // Calcular nova temperatura baseada na intenção
      const tempMap = {
        'decisão': 90, 'consideração': 70, 'interesse': 50, 'curiosidade': 30, 'objeção': 20
      };
      const newTemperature = tempMap[profile?.buying_stage] || lead.temperature || 30;

      return {
        suggestedResponse: sdrResponse?.response || 'Em processamento...',
        rationale: sdrResponse?.rationale,
        nextAction: sdrResponse?.next_action,
        urgencyLevel: sdrResponse?.urgency_level,
        followupTrigger: sdrResponse?.followup_trigger,
        analysis: {
          intencao: profile?.buying_stage,
          temperatura: profile?.disc === 'D' || profile?.buying_stage === 'decisão' ? 'quente'
            : profile?.buying_stage === 'interesse' ? 'morno' : 'frio',
          probabilidade: newTemperature,
          resumo: profile?.summary,
          disc: profile?.disc,
          emotional_state: profile?.emotional_state
        },
        newTemperature
      };
    } catch (err) {
      console.error('[SDR Alanis V3 Error]', err.message);
      return {
        suggestedResponse: 'Não consegui gerar uma sugestão agora. Verifique sua conexão.',
        error: true
      };
    }
  }

  /**
   * Gera templates contextuais baseados no perfil do lead e estágio do funil
   */
  async generateSmartTemplates(leadId) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          memory: true,
          messages: { orderBy: { createdAt: 'desc' }, take: 5 }
        }
      });
      if (!lead) return [];

      const lastMessages = lead.messages.map(m =>
        `${m.sender === 'user' ? 'Eu' : lead.name}: ${m.content}`
      ).join('\n');

      const prompt = `Gere 6 templates de mensagem para ${lead.name}.

CONTEXTO:
- Status: ${lead.status || 'NOVO'}
- Perfil DISC: ${lead.memory?.disc || 'não mapeado'}
- Últimas mensagens: ${lastMessages || 'Nenhuma ainda'}

REGRAS:
- Cada template deve ser ESPECÍFICO para este lead, não genérico
- Máximo 2 linhas cada
- Tom natural, humano, sem linguagem robótica
- Cobrir diferentes momentos: quebra-gelo, qualificação, proposta de valor, objeção, urgência, fechamento

RETORNE APENAS JSON VÁLIDO (array de objetos):
[
  { "label": "nome curto do template", "text": "mensagem completa" },
  { "label": "...", "text": "..." }
]`;

      const result = await aiOrchestrator.call(prompt, 'Você é Alanis, SDR da Wise Company. Crie templates humanizados e contextualizados.');
      return Array.isArray(result) ? result : [];
    } catch (err) {
      console.error('[SmartTemplates Error]', err.message);
      return [];
    }
  }

  /**
   * Atualiza memória do lead com dados acumulados de todas as análises
   */
  async updateLeadMemory(leadId, profile, analysis, existingMemory) {
    try {
      const data = {
        disc: profile?.disc || existingMemory?.disc,
        summary: profile?.summary || existingMemory?.summary,
        interactions: (existingMemory?.interactions || 0) + 1,
        lastAnalysis: { profile, analysis, timestamp: new Date().toISOString() },
        communicationStyle: profile?.communication_style || existingMemory?.communicationStyle,
        painSignals: profile?.pain_signals || existingMemory?.painSignals || [],
        predictedObjections: profile?.objections_predicted || existingMemory?.predictedObjections || []
      };

      await prisma.leadMemory.upsert({
        where: { leadId },
        update: data,
        create: { leadId, ...data }
      });
    } catch (err) {
      console.error('[LeadMemory Update Error]', err.message);
    }
  }

  async callAI(prompt) {
    return await aiOrchestrator.call(prompt);
  }
}

module.exports = new SDRService();
