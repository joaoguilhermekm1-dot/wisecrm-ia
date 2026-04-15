const prisma = require('../lib/prisma');
const { getIO } = require('../lib/socket');
const intelligenceService = require('../services/intelligence.service');

// Token de verificação (configure no .env)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'wise_crm_ia_2026';

/**
 * Controller para processar Webhooks da Meta (WhatsApp & Instagram)
 */
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[Webhook] Verificação bem sucedida!');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
};

exports.handleIncoming = async (req, res) => {
  const body = req.body;

  // Responder 200 OK imediatamente para a Meta
  res.status(200).send('EVENT_RECEIVED');

  try {
    // 1. Identificar o tipo de objeto
    if (body.object === 'whatsapp_business_account') {
      await handleWhatsApp(body);
    } else if (body.object === 'instagram') {
      await handleInstagram(body);
    }
  } catch (err) {
    console.error('[Webhook] Erro ao processar evento:', err.message);
  }
};

async function handleWhatsApp(payload) {
  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];
  const contact = value?.contacts?.[0];

  if (!message) return;

  const senderPhone = message.from;
  const text = message.text?.body;
  const waId = contact?.wa_id;

  console.log(`[WhatsApp] Mensagem de ${senderPhone}: ${text}`);

  // 1. Buscar ou criar o Lead pelo telefone
  let lead = await prisma.lead.findFirst({
    where: { phone: senderPhone }
  });

  if (!lead) {
    // Criar se não existir
    lead = await prisma.lead.create({
      data: {
        name: contact?.profile?.name || senderPhone,
        phone: senderPhone,
        source: 'WhatsApp',
        status: 'NEW'
        // Adicionar pipeline ID futuramente
      }
    });
  }

  // 2. Salvar a Mensagem
  const newMessage = await prisma.message.create({
    data: {
      content: text,
      sender: 'client',
      type: 'whatsapp',
      leadId: lead.id
    }
  });

  // 3. Notificar via Socket.io o dono do lead
  const io = getIO();
  io.to(`user:${lead.ownerId}`).emit('message:new', {
    conversationId: lead.conversations?.[0]?.id, // Simplificação para o socket global
    message: newMessage
  });

  // 4. Trigger IA Copilot (Assíncrono)
  processIntelligence(lead, text);
}

async function processIntelligence(lead, text) {
  try {
    const analysis = await intelligenceService.analyzeLead({
      name: lead.name,
      rawMessage: text,
      source: lead.source
    });

    const io = getIO();
    io.to(`user:${lead.ownerId}`).emit('ai:suggestion', {
      leadId: lead.id,
      suggestion: analysis.suggested_message,
      insight: analysis.brain_insight
    });
  } catch (err) {
    console.error('[Intelligence] Erro ao processar copilot:', err.message);
  }
}
