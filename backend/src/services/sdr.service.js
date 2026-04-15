const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../lib/prisma');

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  ALANIS — AGENTE SDR ELITE DA WISE COMPANY
 *  Treinada em: SPIN Selling, Challenger Sale, NLP Conversacional,
 *  DISC, Rapport, Copywriting, Comportamento Humano, Empreendedorismo,
 *  Fluxo Comercial, Comunicação Persuasiva, Funis de Vendas.
 * ═══════════════════════════════════════════════════════════════════════
 */
class SDRService {
  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.MODEL = 'claude-3-5-sonnet-20241022';
  }

  // ─────────────────────────────────────────────────────────────────────
  // AGENTE 1: PROFILER — Analisa o perfil comportamental do lead
  // ─────────────────────────────────────────────────────────────────────
  async agentProfiler(messages, currentMemory = null) {
    const history = messages.slice(-10).map(m =>
      `[${m.sender === 'user' ? 'VENDEDOR' : 'LEAD'}]: ${m.content}`
    ).join('\n');

    const existingProfile = currentMemory ? `
PERFIL ACUMULADO ATÉ AGORA:
- DISC: ${currentMemory.disc || 'não identificado'}
- Tom: ${currentMemory.toneStyle || 'não identificado'}
- Ritmo: ${currentMemory.pace || 'não identificado'}
- Objeções levantadas: ${(currentMemory.objections || []).join(', ') || 'nenhuma'}
- O que ressoou: ${(currentMemory.hooks || []).join(', ') || 'nenhum'}
- Dores identificadas: ${(currentMemory.painPoints || []).join(', ') || 'nenhuma'}
- Desejos: ${(currentMemory.desires || []).join(', ') || 'nenhum'}
` : '';

    const prompt = `Você é um especialista mundial em perfilagem comportamental, com domínio em DISC, MBTI, PNL, análise linguística e psicologia de vendas.

${existingProfile}

CONVERSA RECENTE:
${history}

TAREFA: Analise a comunicação do lead e retorne um perfil atualizado em JSON.

Diretrizes DISC:
- D (Dominante): direto, impaciente, foco em resultados, pouca emoção
- I (Influente): animado, sociável, usa emojis, fala muito, entusiasta
- S (Estável): cauteloso, passivo, precisa de segurança, perguntas de validação
- C (Cauteloso): analítico, pergunta detalhes, quer provas, lógico

Analise:
- Tamanho das mensagens (curto = D/C, longo = I/S)
- Uso de emojis (muito = I, nenhum = D/C)
- Velocidade de resposta implícita no contexto
- Tipo de perguntas (racionais = C, emocionais = I, práticas = D)
- Objeções levantadas (preço = C/D, relacionamento = S/I)

RETORNE JSON:
{
  "disc": "D|I|S|C",
  "toneStyle": "formal|casual|direto|empatico|tecnico",
  "pace": "rapido|moderado|lento",
  "objections": ["lista de objeções novas identificadas"],
  "hooks": ["o que funcionou ou ressoou nessa conversa"],
  "painPoints": ["dores ou problemas identificados"],
  "desires": ["objetivos ou desejos explicitados"],
  "summary": "Resumo de 2 frases sobre o perfil comportamental do lead"
}`;

    return await this.callAI(prompt);
  }

  // ─────────────────────────────────────────────────────────────────────
  // AGENTE 2: SDR ALANIS — Gera resposta humanizada e adaptada ao perfil
  // ─────────────────────────────────────────────────────────────────────
  async agentSDR(lead, currentMessage, memory, analysis) {
    const memoryContext = memory ? `
PERFIL COMPORTAMENTAL DO LEAD:
- Tipo DISC: ${memory.disc || 'I'} (${this.discDescription(memory.disc)})
- Tom de comunicação preferido: ${memory.toneStyle || 'casual'}
- Ritmo de resposta: ${memory.pace || 'moderado'}
- Objeções que já surgiram: ${(memory.objections || []).join(', ') || 'nenhuma ainda'}
- O que ressoou com ele: ${(memory.hooks || []).join(', ') || 'nenhum ainda'}
- Dores identificadas: ${(memory.painPoints || []).join(', ') || 'nenhuma ainda'}
- Desejos e objetivos: ${(memory.desires || []).join(', ') || 'não mapeado ainda'}
- Contexto acumulado: ${memory.summary || 'primeiro contato'}
- Interações anteriores: ${memory.interactions || 0}
` : 'Primeiro contato com o lead, sem histórico prévio.';

    const analysisContext = analysis ? `
ANÁLISE DA MENSAGEM ATUAL:
- Intenção: ${analysis.intencao}
- Temperatura: ${analysis.temperatura}
- Nível de consciência: ${analysis.consciencia}
- Probabilidade de fechamento: ${analysis.probabilidade}%
- Resumo: ${analysis.resumo}
` : '';

    const prompt = `Você é ALANIS, a melhor SDR (Sales Development Representative) do mundo, trabalhando na Wise Company.

IDENTIDADE:
- Você é humanizada, empática e estratégica
- Você domina SPIN Selling, Rapport, NLP, Storytelling de Vendas e Copywriting Conversacional
- Você NUNCA parece um robô ou script genérico
- Você adapta COMPLETAMENTE sua comunicação ao perfil de cada lead
- Você sabe criar urgência de forma natural e elegante
- Você move o lead no funil sem pressão explícita

LEAD: ${lead.name}
MENSAGEM ATUAL DO LEAD: "${currentMessage}"

${memoryContext}
${analysisContext}

REGRAS DE OURO:
1. Se DISC = D: seja DIRETA, sem rodeios, foco em resultado/ROI, máximo 2 frases
2. Se DISC = I: seja ENTUSIASMADA, use 1-2 emojis, seja calorosa, crie conexão pessoal
3. Se DISC = S: seja ACOLHEDORA, dê segurança, não pressione, valide os sentimentos dele
4. Se DISC = C: seja TÉCNICA, forneça dados/provas, evite emoções excessivas, seja precisa
5. SEMPRE termine com uma pergunta ou micro-CTA que avance a conversa
6. NUNCA use: "Olá! Como posso ajudar?" ou frases genéricas
7. Use o nome do lead com naturalidade (máximo 1x por resposta)
8. Se houver objeções, use o método FEEL-FELT-FOUND ou ARCA
9. Máximo 3 frases por resposta (a menos que seja necessário mais)
10. Seja 100% HUMANA, não mencione que é IA

RETORNE JSON:
{
  "response": "texto da resposta aqui",
  "tone_used": "tom que você usou",
  "strategy": "estratégia aplicada nessa resposta"
}`;

    return await this.callAI(prompt);
  }

  // ─────────────────────────────────────────────────────────────────────
  // AGENTE 3: ESTRATEGISTA — Define próximo passo comercial
  // ─────────────────────────────────────────────────────────────────────
  async agentStrategist(lead, analysis, memory) {
    const prompt = `Você é o Estrategista Comercial Chefe da Wise Company, com 20 anos de experiência em vendas B2B e B2C.

LEAD: ${lead.name}
STATUS ATUAL: ${lead.status}
TEMPERATURA: ${lead.temperature}%
PROBABILIDADE: ${lead.probability}%

ANÁLISE DA IA:
${JSON.stringify(analysis, null, 2)}

PERFIL DO LEAD:
- DISC: ${memory?.disc || 'não mapeado'}
- Objeções: ${(memory?.objections || []).join(', ') || 'nenhuma'}
- Dores: ${(memory?.painPoints || []).join(', ') || 'não mapeadas'}

ESTRATÉGIA POR TEMPERATURA:
- QUENTE (70-100): Fechar AGORA. Proposta, agendamento, contrato.
- MORNO (30-69): Nutrir com prova social, caso de sucesso ou valor percebido.
- FRIO (0-29): Educação, conteúdo de valor, sem pitch direto ainda.

RETORNE JSON:
{
  "proxima_acao": "ex: enviar proposta, agendar call, mandar case de sucesso",
  "tempo_acao": "ex: imediato, 2h, hoje, amanhã",
  "objetivo": "ex: avançar para proposta, quebrar objeção de preço",
  "sugestao_estrategica": "instrução curta e prática para o vendedor",
  "stage_sugerido": "ex: DIAGNÓSTICO, PROPOSTA, FECHAMENTO"
}`;

    return await this.callAI(prompt);
  }

  // ─────────────────────────────────────────────────────────────────────
  // PIPELINE PRINCIPAL — Orquestra os 3 agentes + atualiza memória
  // ─────────────────────────────────────────────────────────────────────
  async processMessage(leadId, currentMessage, messages = []) {
    try {
      // 1. Buscar lead + memória acumulada
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { memory: true, messages: { orderBy: { createdAt: 'asc' }, take: 20 } }
      });

      if (!lead) throw new Error('Lead não encontrado');

      const memory = lead.memory;
      const recentMessages = messages.length > 0 ? messages : lead.messages;

      // 2. Agente Profiler — atualiza perfil comportamental
      const profile = await this.agentProfiler(recentMessages, memory);

      // 3. Análise rápida da mensagem atual (reutilizar lógica do intelligence service)
      const quickAnalysis = {
        intencao: 'interesse',
        temperatura: lead.temperature >= 70 ? 'quente' : lead.temperature >= 30 ? 'morno' : 'frio',
        consciencia: lead.consciousness || 'médio',
        probabilidade: lead.probability || 30,
        resumo: lead.summary || 'Lead em análise'
      };

      // 4. Agente SDR — gera resposta humanizada
      const sdrResponse = await this.agentSDR(lead, currentMessage, memory, quickAnalysis);

      // 5. Agente Estrategista — define próximo passo
      const strategy = await this.agentStrategist(lead, quickAnalysis, memory);

      // 6. Atualizar memória do lead no banco
      await this.updateLeadMemory(leadId, profile, memory);

      // 7. Atualizar temperatura/probability do lead
      const tempMap = { 'quente': 100, 'morno': 50, 'frio': 20 };
      const newTemp = tempMap[quickAnalysis.temperatura] || lead.temperature;

      return {
        suggestedResponse: sdrResponse.response,
        analysis: quickAnalysis,
        strategy,
        profile,
        toneUsed: sdrResponse.tone_used,
        strategyUsed: sdrResponse.strategy,
        newTemperature: Math.max(lead.temperature, newTemp) // só sobe, nunca desce sem ação
      };
    } catch (err) {
      console.error('[SDR Alanis Error]', err.message);
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // SMART TEMPLATES — Gera templates personalizados para o lead
  // ─────────────────────────────────────────────────────────────────────
  async generateSmartTemplates(leadId) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          memory: true,
          messages: { orderBy: { createdAt: 'desc' }, take: 5 }
        }
      });

      if (!lead) return this.getDefaultTemplates();

      const memory = lead.memory;
      const lastMessages = lead.messages.map(m =>
        `[${m.sender === 'user' ? 'VENDEDOR' : 'LEAD'}]: ${m.content}`
      ).join('\n');

      const prompt = `Você é ALANIS, SDR da Wise Company. Gere 6 templates de mensagem PERSONALIZADOS para o lead abaixo.

LEAD: ${lead.name}
STATUS: ${lead.status}
TEMPERATURA: ${lead.temperature}%
PERFIL DISC: ${memory?.disc || 'não identificado'}
TOM PREFERIDO: ${memory?.toneStyle || 'casual'}
DORES IDENTIFICADAS: ${(memory?.painPoints || []).join(', ') || 'nenhuma'}
DESEJOS: ${(memory?.desires || []).join(', ') || 'nenhum'}
OBJEÇÕES: ${(memory?.objections || []).join(', ') || 'nenhuma'}

ÚLTIMAS MENSAGENS:
${lastMessages || 'Nenhuma mensagem ainda'}

REGRAS:
- Cada template deve ser específico para ESSE lead, não genérico
- Adapte o tom ao perfil DISC identificado
- Inclua contexto real da conversa quando possível
- Templates devem cobrir: abertura, nutrir, quebra de objeção, urgência, proposta, follow-up
- Máximo 2 linhas por template
- Seja humanizado e natural

RETORNE JSON (array de 6 objetos):
[
  { "label": "emoji + nome curto", "text": "texto do template" },
  ...
]`;

      const result = await this.callAI(prompt);

      // result pode ser array diretamente ou ter uma propriedade
      if (Array.isArray(result)) return result;
      if (Array.isArray(result.templates)) return result.templates;

      return this.getDefaultTemplates();
    } catch (err) {
      console.error('[Smart Templates Error]', err.message);
      return this.getDefaultTemplates();
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // ATUALIZAR MEMÓRIA DO LEAD
  // ─────────────────────────────────────────────────────────────────────
  async updateLeadMemory(leadId, profile, existingMemory) {
    try {
      // Mesclar dados novos com os existentes (acumular, não sobrescrever)
      const mergedObjections = [...new Set([
        ...(existingMemory?.objections || []),
        ...(profile.objections || [])
      ])].slice(0, 10); // max 10

      const mergedHooks = [...new Set([
        ...(existingMemory?.hooks || []),
        ...(profile.hooks || [])
      ])].slice(0, 10);

      const mergedPainPoints = [...new Set([
        ...(existingMemory?.painPoints || []),
        ...(profile.painPoints || [])
      ])].slice(0, 10);

      const mergedDesires = [...new Set([
        ...(existingMemory?.desires || []),
        ...(profile.desires || [])
      ])].slice(0, 10);

      const data = {
        disc: profile.disc || existingMemory?.disc,
        toneStyle: profile.toneStyle || existingMemory?.toneStyle,
        pace: profile.pace || existingMemory?.pace,
        objections: mergedObjections,
        hooks: mergedHooks,
        painPoints: mergedPainPoints,
        desires: mergedDesires,
        summary: profile.summary || existingMemory?.summary,
        interactions: (existingMemory?.interactions || 0) + 1,
        lastAnalysis: profile
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

  // ─────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────
  discDescription(disc) {
    const map = {
      D: 'Dominante — direto, impaciente, foco em resultado',
      I: 'Influente — animado, sociável, emocional, entusiasta',
      S: 'Estável — cauteloso, precisa de segurança, passivo',
      C: 'Cauteloso — analítico, quer dados e provas, lógico'
    };
    return map[disc] || 'Perfil não identificado ainda';
  }

  getDefaultTemplates() {
    return [
      { label: '👋 Boas-vindas', text: 'Olá! Obrigado por entrar em contato. Como posso te ajudar hoje?' },
      { label: '📅 Agendar', text: 'Ótimo! Vamos agendar uma conversa. Qual o melhor horário para você?' },
      { label: '📋 Proposta', text: 'Preparei uma proposta personalizada para você. Posso te enviar agora?' },
      { label: '🔥 Urgência', text: 'Esta oferta é por tempo limitado! Posso te ajudar a fechar hoje?' },
      { label: '✅ Confirmação', text: 'Perfeito! Tudo confirmado. Em breve entrarei em contato com mais detalhes.' },
      { label: '📞 Follow-up', text: 'Oi! Só passando para saber se ficou alguma dúvida. Posso ajudar em algo?' },
    ];
  }

  async callAI(prompt) {
    try {
      const response = await this.anthropic.messages.create({
        model: this.MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (err) {
      console.error('[SDR callAI Error]', err.message);
      throw err;
    }
  }
}

module.exports = new SDRService();
