const prisma = require('../lib/prisma');
const intelligenceService = require('../services/intelligence.service');
const whatsappService = require('../services/whatsapp.service');

exports.createLead = async (req, res) => {
  const { name, email, phone, source, notes, rawMessage } = req.body;
  const userId = req.user.userId;

  try {
    // 1. Buscar ou criar a pipeline padrão do usuário
    let pipeline = await prisma.pipeline.findFirst({ where: { userId } });

    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: {
          name: 'Funil Wise (Padrão)',
          stages: ['NEW', 'DIAGNÓSTICO', 'PROPOSTA', 'FECHAMENTO', 'PERDIDO'],
          userId
        }
      });
    }

    // 2. Criar o Lead
    const lead = await prisma.lead.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        source: source || 'Manual',
        status: 'NEW',
        notes: notes || null,
        pipelineId: pipeline.id,
        ownerId: userId
      }
    });

    // 3. IA Intelligence — FIRE & FORGET (não bloqueia a resposta)
    // Executa em background sem await para não crashar se a API da Anthropic falhar
    setImmediate(async () => {
      try {
        if (intelligenceService.processCommercialPipeline) {
          const brainAnalysis = await intelligenceService.processCommercialPipeline(
            lead.id, rawMessage || `Novo lead: ${name}`, []
          );
          if (brainAnalysis?.suggestedResponse) {
            await prisma.message.create({
              data: {
                content: `🧠 IA Insight: ${brainAnalysis.suggestedResponse}`,
                sender: 'ai',
                leadId: lead.id
              }
            });
          }
        }
      } catch (aiErr) {
        // Silencioso — não afeta a criação do lead
        console.warn('[Intelligence] Análise IA ignorada:', aiErr.message);
      }
    });

    // 4. Resposta imediata com o lead criado
    res.status(201).json({ lead });
  } catch (err) {
    console.error('[createLead Error]', err);
    res.status(500).json({ error: 'Erro ao criar lead.' });
  }
};

exports.createLeadsBatch = async (req, res) => {
  const { leads } = req.body;
  const userId = req.user.userId;

  if (!leads || !Array.isArray(leads)) {
    return res.status(400).json({ error: 'Payload inválido.' });
  }

  try {
    let pipeline = await prisma.pipeline.findFirst({
      where: { userId }
    });

    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: {
          name: 'Funil Wise (Padrão)',
          stages: ['NEW', 'DIAGNÓSTICO', 'PROPOSTA', 'FECHAMENTO', 'PERDIDO'],
          userId
        }
      });
    }

    const dataToInsert = leads.map(l => ({
      name: l.name || l.username || 'Desconhecido',
      email: l.email || null,
      phone: l.phone || null,
      source: l.source || 'Apify Discovery',
      status: 'NEW', // Stage inicial padrão
      pipelineId: pipeline.id,
      ownerId: userId,
      metadata: {
        website: l.website || null,
        instagram: l.instagram || null,
        url: l.url || null,
        rating: l.rating || null,
        followersCount: l.followersCount || null,
        address: l.address || null,
        category: l.category || null
      }
    }));

    const result = await prisma.lead.createMany({
      data: dataToInsert,
      skipDuplicates: true
    });

    res.status(201).json({ message: 'Leads importados com sucesso', count: result.count });
  } catch (err) {
    console.error('Erro ao importar em lote', err);
    res.status(500).json({ error: 'Erro ao importar leads do Discovery.' });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { ownerId: req.user.userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(leads);
  } catch (err) {
    console.error('[Leads Controller] Error:', err);
    res.status(500).json({ error: 'Erro ao buscar leads.' });
  }
};

exports.updateLead = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, status, source, notes } = req.body;

  try {
    const lead = await prisma.lead.findFirst({
      where: { id, ownerId: req.user.userId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(status !== undefined && { status }),
        ...(source !== undefined && { source }),
        ...(notes !== undefined && { notes }),
      }
    });

    try {
      const io = require('../lib/socket').getIO();
      io.to(`user:${req.user.userId}`).emit('lead:update', updatedLead);
    } catch (e) {}

    res.json(updatedLead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar lead.' });
  }
};

exports.deleteLead = async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await prisma.lead.findFirst({
      where: { id, ownerId: req.user.userId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }

    // Respeitar a ordem das FK: Messages -> Conversations -> Lead
    await prisma.message.deleteMany({ where: { leadId: id } });
    await prisma.conversation.deleteMany({ where: { leadId: id } });
    await prisma.lead.delete({ where: { id } });

    res.json({ message: 'Lead removido com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover lead.' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { leadId: req.params.id },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens.' });
  }
};

exports.sendMessage = async (req, res) => {
  const { content } = req.body;
  const leadId = req.params.id;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { conversations: { take: 1 } }
    });
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

    // 1. Enviar via motor WhatsApp se houver telefone
    let sentViaWhatsApp = false;
    if (lead.phone || lead.whatsappJid) {
       try {
         const { type, mediaUrl, filename } = req.body;
         await whatsappService.sendMessage(lead.phone || lead.whatsappJid, content, { type, mediaUrl, filename });
         sentViaWhatsApp = true;
       } catch (wsErr) {
         console.error('[Leads Controller] Erro ao disparar WA:', wsErr.message);
       }
    }

    let message = null;

    // 2. Se NÃO foi enviado pelo WhatsApp, salvar no Banco localmente para manter o histórico CRM
    if (!sentViaWhatsApp) {
      // Garantir que exista uma Conversation
      let conversationId = lead.conversations[0]?.id || null;
      if (!conversationId) {
         const jidLocal = lead.whatsappJid || (lead.phone ? `${lead.phone}@s.whatsapp.net` : `local_${leadId}`);
         const newConv = await prisma.conversation.upsert({
           where: { jid: jidLocal },
           update: { updatedAt: new Date() },
           create: { jid: jidLocal, leadId, platform: 'crm' }
         });
         conversationId = newConv.id;
      }

      message = await prisma.message.create({
        data: {
          content: content || '[Mídia]',
          sender: 'user',
          type: req.body.type || 'text',
          leadId,
          conversationId
        }
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessage: content || '[Mídia]', unreadCount: 0 }
      });
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { lastInteractionAt: new Date() }
    });

    res.status(201).json(message || { external: true });
  } catch (err) {
    console.error('[Leads Controller] Erro ao enviar mensagem:', err);
    res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
};

exports.getAISuggestion = async (req, res) => {
  const leadId = req.params.id;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { 
        messages: { 
          orderBy: { createdAt: 'asc' }, 
          take: 10 
        },
        memory: true
      }
    });

    if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

    const sdrService = require('../services/sdr.service');
    const lastLeadMessage = lead.messages
      .filter(m => m.sender === 'lead')
      .slice(-1)[0]?.content || 'Primeiro contato.';

    const result = await sdrService.processMessage(leadId, lastLeadMessage, lead.messages);
    res.json(result);
  } catch (err) {
    console.error('[Leads Controller] Erro na sugestão do SDR Alanis:', err);
    res.status(500).json({ error: 'Erro ao gerar sugestão da IA.' });
  }
};

exports.getSmartTemplates = async (req, res) => {
  const leadId = req.params.id;

  try {
    const sdrService = require('../services/sdr.service');
    const templates = await sdrService.generateSmartTemplates(leadId);
    res.json(templates);
  } catch (err) {
    console.error('[Smart Templates Error]', err);
    res.status(500).json({ error: 'Erro ao gerar templates.' });
  }
};
exports.getConversations = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { ownerId: req.user.userId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        conversations: { take: 1 }
      },
      orderBy: { updatedAt: 'desc' },
      take: 100
    });
    
    // Formatar como `conversations` para o front-end
    const conversations = leads.map(lead => {
      const conv = lead.conversations[0] || {};
      const lastMsg = lead.messages[0];
      return {
        id: conv.id || `virtual_${lead.id}`,
        jid: lead.whatsappJid || lead.phone || '',
        unreadCount: conv.unreadCount || 0,
        updatedAt: lead.lastInteractionAt || lead.updatedAt,
        leadId: lead.id,
        lead: lead,
        lastMessage: lastMsg ? lastMsg.content : 'Nenhuma mensagem'
      };
    });
    
    // Sort by recent activity
    conversations.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json(conversations);
  } catch (err) {
    console.error('[Leads] Erro no getConversations', err);
    res.status(500).json({ error: 'Erro ao buscar conversas.' });
  }
};
