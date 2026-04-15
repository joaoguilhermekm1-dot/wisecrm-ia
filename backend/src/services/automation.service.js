const prisma = require('../lib/prisma');
const intelligenceService = require('./intelligence.service');
const { getIO } = require('../lib/socket');

class AutomationService {
  constructor() {
    this.checkInterval = 1000 * 60 * 60; // 1 hora
  }

  start() {
    console.log('🚀 [Automation Service] Iniciando monitoramento de Follow-ups...');
    setInterval(() => this.checkFollowUps(), this.checkInterval);
  }

  async checkFollowUps() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Buscar leads sem interação há mais de 24h, que não estejam 'fechados' ou 'perdidos'
      const idleLeads = await prisma.lead.findMany({
        where: {
          lastInteractionAt: { lt: oneDayAgo },
          status: { notIn: ['FECHADO', 'PERDIDO'] }
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      console.log(`[Automation] Encontrados ${idleLeads.length} leads inativos para follow-up.`);

      for (const lead of idleLeads) {
        await this.generateFollowUp(lead);
      }
    } catch (err) {
      console.error('[Automation Error]', err.message);
    }
  }

  async generateFollowUp(lead) {
    try {
      // 1. IA gera o follow-up baseado no histórico
      const prompt = `
Você é o Estrategista Comercial da Wise CRM.
O lead "${lead.name}" não responde há mais de 24 horas.

RESUMO DO LEAD:
${lead.summary || 'Lead em prospecção.'}
TEMPERATURA: ${lead.temperature}%

HISTÓRICO RECENTE:
${lead.messages.map(m => `${m.sender}: ${m.content}`).join('\n')}

TAREFA:
Crie uma mensagem de follow-up que seja:
- Curta (máximo 2 linhas).
- Natural e leve (sem parecer cobrança).
- Reativadora de interesse.

RETORNE JSON:
{
  "follow_up_message": "texto da mensagem aqui",
  "reasoning": "por que esta abordagem?"
}
`;

      const aiResponse = await intelligenceService.callAI(prompt);
      
      // 2. Notificar o Vendedor (Sugerir Follow-up)
      const io = getIO();
      io.to(`user:${lead.ownerId}`).emit('ai:follow_up_suggestion', {
        leadId: lead.id,
        message: aiResponse.follow_up_message,
        reasoning: aiResponse.reasoning
      });

      console.log(`[Automation] Sugestão de Follow-up gerada para: ${lead.name}`);
    } catch (err) {
      console.error(`[Automation] Erro ao gerar follow-up para ${lead.id}:`, err.message);
    }
  }
}

module.exports = new AutomationService();
