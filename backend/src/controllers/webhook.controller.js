const prisma = require('../lib/prisma');
const { getIO } = require('../lib/socket');
const sdrService = require('../services/sdr.service');
const crypto = require('crypto');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'wise_crm_ia_2026';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const META_PIXEL_ID = process.env.META_PIXEL_ID || '';
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || '';

// ── Verificação de assinatura Meta ──────────────────────────────────────────
function verifyMetaSignature(req) {
  if (!META_APP_SECRET) return true; // Pular se não configurado
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', META_APP_SECRET)
    .update(JSON.stringify(req.body)).digest('hex');
  return sig === expected;
}

// ── Disparo de evento CAPI (server-side) ───────────────────────────────────
async function sendCAPIEvent(eventName, lead, customData = {}) {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return;
  try {
    const axios = require('axios');
    const userData = {};
    if (lead.email) userData.em = [crypto.createHash('sha256').update(lead.email.trim().toLowerCase()).digest('hex')];
    if (lead.phone) userData.ph = [crypto.createHash('sha256').update(lead.phone.replace(/\D/g, '')).digest('hex')];

    await axios.post(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events`, {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'other',
        user_data: userData,
        custom_data: { currency: 'BRL', ...customData }
      }]
    }, {
      params: { access_token: META_CAPI_TOKEN },
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`[CAPI] Evento "${eventName}" disparado para lead ${lead.id}`);
  } catch (err) {
    console.error('[CAPI Error]', err.response?.data?.error?.message || err.message);
  }
}

// ── Verificação do Webhook Meta ─────────────────────────────────────────────
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Verificado com sucesso!');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
};

// ── Handler principal ───────────────────────────────────────────────────────
exports.handleIncoming = async (req, res) => {
  // Responde 200 imediatamente (requisito da Meta)
  res.status(200).send('EVENT_RECEIVED');

  if (!verifyMetaSignature(req)) {
    console.warn('[Webhook] Assinatura inválida. Ignorando.');
    return;
  }

  const body = req.body;
  try {
    if (body.object === 'whatsapp_business_account') {
      await handleWhatsApp(body);
    } else if (body.object === 'instagram') {
      await handleInstagram(body);
    } else if (body.object === 'page') {
      await handleFacebook(body);
    }
  } catch (err) {
    console.error('[Webhook] Erro ao processar evento:', err.message);
  }
};

// ── Processamento de mensagem WhatsApp via Cloud API ───────────────────────
async function handleWhatsApp(payload) {
  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];
  const contact = value?.contacts?.[0];

  if (!message) return;

  const senderPhone = message.from;
  const pushName = contact?.profile?.name || senderPhone;
  const referral = message.referral;

  let textContent = '';
  let msgType = 'text';
  let mediaUrl = null;

  if (message.type === 'text') {
    textContent = message.text?.body || '';
  } else if (message.type === 'image') {
    textContent = message.image?.caption || '🖼️ Imagem recebida';
    msgType = 'image';
  } else if (message.type === 'audio') {
    textContent = '🎵 Áudio recebido';
    msgType = 'audio';
  } else if (message.type === 'video') {
    textContent = message.video?.caption || '📹 Vídeo recebido';
    msgType = 'video';
  } else if (message.type === 'document') {
    textContent = message.document?.filename || '📄 Documento recebido';
    msgType = 'document';
  } else {
    textContent = `[${message.type}]`;
  }

  console.log(`[WhatsApp Cloud] ${pushName} (${senderPhone}): ${textContent}`);

  // Buscar ou criar lead
  const defaultAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!defaultAdmin) return;

  let lead = await prisma.lead.findFirst({
    where: { OR: [{ phone: senderPhone }, { phone: senderPhone.replace(/^55/, '') }] }
  });

  if (!lead) {
    let pipeline = await prisma.pipeline.findFirst({ where: { userId: defaultAdmin.id } });
    if (!pipeline) {
      const DEFAULT_STAGES = ['NOVO', 'PROSPECÇÃO', 'DIAGNÓSTICO', 'FECHAMENTO', 'FECHADO', 'FOLLOW-UP'];
      pipeline = await prisma.pipeline.create({
        data: { name: 'Funil Wise (Padrão)', stages: DEFAULT_STAGES, userId: defaultAdmin.id }
      });
    }
    lead = await prisma.lead.create({
      data: {
        name: pushName,
        phone: senderPhone,
        whatsappJid: `${senderPhone}@s.whatsapp.net`,
        source: referral ? 'Meta Ads' : 'WhatsApp',
        adId: referral?.source_id || null,
        utmSource: referral?.source_type || null,
        metadata: referral ? { referral_headline: referral.headline } : {},
        status: 'NOVO',
        ownerId: defaultAdmin.id,
        pipelineId: pipeline.id
      }
    });
    // Disparar evento CAPI Lead (novo contato)
    sendCAPIEvent('Lead', lead, { content_name: 'WhatsApp Contact', status: referral ? 'ad_referral' : 'organic' });
  }

  // Upsert conversa
  const conv = await prisma.conversation.upsert({
    where: { jid: `${senderPhone}@s.whatsapp.net` },
    update: { lastMessage: textContent, unreadCount: { increment: 1 }, updatedAt: new Date() },
    create: { jid: `${senderPhone}@s.whatsapp.net`, leadId: lead.id, platform: 'whatsapp', lastMessage: textContent }
  });

  // Salvar mensagem
  const newMessage = await prisma.message.create({
    data: { content: textContent, sender: 'lead', type: msgType, mediaUrl, leadId: lead.id, conversationId: conv.id }
  });

  // Emitir via Socket
  const io = getIO();
  io.to(`user:${lead.ownerId}`).emit('message:new', { conversationId: conv.id, message: newMessage });

  // Disparo assíncrono da IA Alanis
  processWithAlanis(lead, textContent, conv.id);
}

async function processWithAlanis(lead, text, conversationId) {
  try {
    const result = await sdrService.processMessage(lead.id, text);
    if (!result || result.error) return;

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        temperature: result.newTemperature || lead.temperature,
        probability: result.analysis?.probabilidade || lead.probability,
        summary: result.analysis?.resumo || lead.summary,
        lastInteractionAt: new Date(),
      }
    });

    const io = getIO();
    io.to(`user:${lead.ownerId}`).emit('ai:decision', {
      leadId: lead.id,
      conversationId,
      suggestedResponse: result.suggestedResponse,
      rationale: result.rationale,
      nextAction: result.nextAction,
      urgencyLevel: result.urgencyLevel,
      analysis: result.analysis,
      realtimeAnalysis: result.realtimeAnalysis || null,
    });
    io.to(`user:${lead.ownerId}`).emit('lead:update', { ...lead, temperature: result.newTemperature });
  } catch (err) {
    console.error('[Alanis Webhook Error]', err.message);
  }
}

async function handleInstagram(payload) {
  console.log('[Webhook] Instagram event recebido:', JSON.stringify(payload).slice(0, 200));
}

async function handleFacebook(payload) {
  console.log('[Webhook] Facebook page event recebido:', JSON.stringify(payload).slice(0, 200));
}

// ── Endpoint CAPI direto (frontend pode chamar para eventos client-side) ────
exports.trackEvent = async (req, res) => {
  const { eventName, leadId, customData } = req.body;
  if (!eventName) return res.status(400).json({ error: 'eventName obrigatório' });

  try {
    let lead = null;
    if (leadId) lead = await prisma.lead.findUnique({ where: { id: leadId } });
    await sendCAPIEvent(eventName, lead || {}, customData || {});
    res.json({ success: true, event: eventName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
