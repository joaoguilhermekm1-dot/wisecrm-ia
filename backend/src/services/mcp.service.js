const prisma = require('../lib/prisma');

/**
 * 🛠️ MCP Service (Model Context Protocol)
 * Define as ferramentas que os agentes de IA podem "usar" para
 * interagir diretamente com o ecossistema do WISE CRM.
 */
class MCPService {
  /**
   * Lista de ferramentas disponíveis para os modelos de IA
   */
  getAvailableTools() {
    return [
      {
        name: 'get_lead_context',
        description: 'Retorna o histórico completo, DNA comportamental e dores de um lead.',
        parameters: {
          type: 'object',
          properties: {
            leadId: { type: 'string', description: 'ID único do lead no CRM' }
          },
          required: ['leadId']
        }
      },
      {
        name: 'update_lead_status',
        description: 'Move o lead para uma nova etapa do funil (Pipeline).',
        parameters: {
          type: 'object',
          properties: {
            leadId: { type: 'string', description: 'ID único do lead' },
            status: { type: 'string', description: 'Novo status (NOVO, PROSPECÇÃO, DIAGNÓSTICO, FECHAMENTO, FECHADO, FOLLOW-UP)' }
          },
          required: ['leadId', 'status']
        }
      },
      {
        name: 'schedule_commercial_reminder',
        description: 'Agenda um lembrete ou tarefa de follow-up para o vendedor.',
        parameters: {
          type: 'object',
          properties: {
            leadId: { type: 'string', description: 'ID do lead' },
            notes: { type: 'string', description: 'O que deve ser feito (ex: ligar para fechar)' },
            dueHours: { type: 'number', description: 'Em quantas horas o lembrete deve disparar' }
          },
          required: ['leadId', 'notes']
        }
      }
    ];
  }

  /**
   * Executor de Ferramentas
   * Traduz a intenção da IA em operações reais no Banco de Dados
   */
  async executeTool(name, args, userId) {
    console.log(`[MCP] Executando ferramenta: ${name}`, args);

    switch (name) {
      case 'get_lead_context':
        return await this.getLeadContext(args.leadId, userId);
      
      case 'update_lead_status':
        return await this.updateLeadStatus(args.leadId, args.status, userId);

      case 'schedule_commercial_reminder':
        return await this.scheduleReminder(args.leadId, args.notes, args.dueHours, userId);

      default:
        throw new Error(`Ferramenta ${name} não implementada.`);
    }
  }

  // --- IMPLEMENTAÇÃO DAS FERRAMENTAS ---

  async getLeadContext(leadId, userId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { memory: true, messages: { take: 10, orderBy: { createdAt: 'desc' } } }
    });
    
    if (!lead || lead.ownerId !== userId) return { error: 'Lead não encontrado ou acesso negado.' };

    return {
      name: lead.name,
      temperature: lead.temperature,
      dna: lead.memory || 'DNA não mapeado',
      lastMessages: lead.messages.map(m => `[${m.sender}]: ${m.content}`)
    };
  }

  async updateLeadStatus(leadId, status, userId) {
    const updated = await prisma.lead.updateMany({
      where: { id: leadId, ownerId: userId },
      data: { status, updatedAt: new Date() }
    });

    if (updated.count === 0) return { error: 'Falha ao atualizar status.' };
    return { success: true, newStatus: status };
  }

  async scheduleReminder(leadId, notes, dueHours = 24, userId) {
    // No MVP, salvamos nas notas do lead com um marcador de [TASK]
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { error: 'Lead não encontrado.' };

    const reminderDate = new Date();
    reminderDate.setHours(reminderDate.getHours() + dueHours);

    const taskText = `\n[LEMBRETE IA - ${reminderDate.toLocaleString()}]: ${notes}`;
    
    await prisma.lead.update({
      where: { id: leadId },
      data: { notes: (lead.notes || '') + taskText }
    });

    return { success: true, scheduledTo: reminderDate };
  }
}

module.exports = new MCPService();
