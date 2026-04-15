const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const { Boom } = require('@hapi/boom');
const prisma = require('../lib/prisma');
const { getIO } = require('../lib/socket');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.qrCodeBase64 = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, CONNECTED
  }

  async initialize(showQR = true) {
    if (this.status === 'CONNECTED') return;
    
    console.log(`[WhatsApp] Inicializando motor Baileys (showQR: ${showQR})...`);
    this.status = 'CONNECTING';
    
    try {
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`[WhatsApp] Usando WA v${version.join('.')}, isLatest: ${isLatest}`);

      const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth_info');

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), 
        browser: Browsers.macOS('Desktop')
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && showQR) {
          this.qrCodeBase64 = await qrcode.toDataURL(qr);
          console.log('[WhatsApp] QR Code Escaneável Disponível!');
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect.error instanceof Boom)
              ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
              : true;
          
          console.log('[WhatsApp] Conexão fechada por:', lastDisconnect.error, ', reconectando:', shouldReconnect);
          this.status = 'DISCONNECTED';
          
          if (shouldReconnect) {
            this.initialize(showQR);
          } else {
            console.log('[WhatsApp] Desconectado permanentemente (Logged out).');
            this.qrCodeBase64 = null;
          }
        } else if (connection === 'open') {
          console.log('[WhatsApp] Conexão Estabelecida com Sucesso! 🚀');
          this.status = 'CONNECTED';
          this.qrCodeBase64 = null;
          
          // Notificar via socket o status
          try { getIO().emit('whatsapp_status', { status: 'CONNECTED' }); } catch(e) {}
        }
      });

      this.sock.ev.on('chats.set', async ({ chats }) => {
        for (const chat of chats) {
          await this.persistConversation(chat.id, chat.name || chat.id);
        }
      });

      this.sock.ev.on('chats.upsert', async (chats) => {
        for (const chat of chats) {
          await this.persistConversation(chat.id, chat.name || chat.id);
        }
      });

      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify' && this.status === 'CONNECTED') {
          for (const msg of messages) {
            if (!msg.message) continue;
            
            const senderJid = msg.key.remoteJid;
            const pushName = msg.pushName || 'Desconhecido';
            const fromMe = msg.key.fromMe;

            let textContent = '';
            if (msg.message.conversation) textContent = msg.message.conversation;
            else if (msg.message.extendedTextMessage) textContent = msg.message.extendedTextMessage.text;
            else if (msg.message.audioMessage) textContent = '🎵 Áudio';
            else if (msg.message.imageMessage) textContent = '🖼️ Imagem';

            if (textContent) {
               await this.persistMessage(senderJid, pushName, textContent, fromMe);
            }
          }
        }
      });

      this.sock.ev.on('messaging-history.set', async ({ messages }) => {
        for (const msg of messages) {
          if (!msg.message) continue;
          const senderJid = msg.key.remoteJid;
          if (!senderJid.endsWith('@s.whatsapp.net')) continue;

          let textContent = '';
          if (msg.message.conversation) textContent = msg.message.conversation;
          else if (msg.message.extendedTextMessage) textContent = msg.message.extendedTextMessage.text;
          
          if (textContent) {
            await this.persistMessage(senderJid, null, textContent, msg.key.fromMe, msg.messageTimestamp);
          }
        }
      });

    } catch (err) {
      console.error('[WhatsApp Initialize Error]', err);
      this.status = 'DISCONNECTED';
    }
  }

  async sendMessage(target, content, options = {}) {
    if (this.status !== 'CONNECTED' || !this.sock) {
      throw new Error('WhatsApp não está conectado.');
    }

    try {
      let jid = target;
      if (!target.includes('@')) {
        jid = `${target.replace(/\D/g, '')}@s.whatsapp.net`;
      }
      
      const { type = 'text', mediaUrl, filename } = options;
      
      let messagePayload = { text: content };
      
      if (type === 'image') {
        messagePayload = { image: { url: mediaUrl }, caption: content };
      } else if (type === 'audio') {
        messagePayload = { audio: { url: mediaUrl }, mimetype: 'audio/mp4', ptt: true };
      } else if (type === 'document') {
        messagePayload = { document: { url: mediaUrl }, fileName: filename || 'documento.pdf', caption: content };
      }
      
      await this.sock.sendMessage(jid, messagePayload);
      await this.persistMessage(jid, null, content || `[${type.toUpperCase()}]`, true);
    } catch (err) {
      console.error('[WhatsApp Send Error]', err);
      throw err;
    }
  }

  async persistConversation(jid, name) {
    if (!jid.endsWith('@s.whatsapp.net')) return null;

    try {
      const user = await prisma.user.findFirst({ where: { email: 'joao@wise.com' } }) ||
                   await prisma.user.findFirst({ where: { role: 'ADMIN' } });

      if (!user) return null;

      const cleanPhone = jid.split('@')[0].replace(/\D/g, '');

      let lead = await prisma.lead.findFirst({
        where: { OR: [{ whatsappJid: jid }, { phone: cleanPhone }], ownerId: user.id }
      });

      if (!lead) {
        let pipeline = await prisma.pipeline.findFirst({ where: { userId: user.id } });
        if (!pipeline) {
          pipeline = await prisma.pipeline.create({
            data: {
              name: 'Funil Wise (Padrão)',
              stages: ['NEW', 'DIAGNÓSTICO', 'PROPOSTA', 'FECHADO'],
              userId: user.id
            }
          });
        }

        lead = await prisma.lead.create({
          data: {
            name: name || 'Novo Contato',
            phone: cleanPhone,
            whatsappJid: jid,
            source: 'WhatsApp',
            status: 'NEW',
            pipelineId: pipeline.id,
            ownerId: user.id
          }
        });
      }

      return await prisma.conversation.upsert({
        where: { jid },
        update: { updatedAt: new Date() },
        create: {
          jid,
          leadId: lead.id,
          platform: 'whatsapp'
        }
      });
    } catch (err) {
      return null;
    }
  }

  async persistMessage(jid, name, content, fromMe, timestamp = null) {
    if (!jid.endsWith('@s.whatsapp.net')) return;

    try {
      const conv = await this.persistConversation(jid, name);
      if (!conv) return;

      const createdAt = timestamp ? new Date(timestamp * 1000) : new Date();

      const message = await prisma.message.create({
        data: {
          content,
          sender: fromMe ? 'user' : 'lead',
          type: content.includes('🎵') ? 'audio' : 'text',
          leadId: conv.leadId,
          conversationId: conv.id,
          createdAt
        }
      });

      const updatedConv = await prisma.conversation.update({
        where: { id: conv.id },
        include: { lead: true },
        data: { 
          lastMessage: content,
          unreadCount: fromMe ? 0 : { increment: 1 } 
        }
      });

      // 3. EMITIR VIA WEBSOCKET (Sala do Usuário e Sala do Chat)
      const io = getIO();
      const ownerId = updatedConv.lead.ownerId;
      
      io.to(`user:${ownerId}`).emit('message:new', {
        conversationId: updatedConv.id,
        message
      });
      io.to(`chat:${updatedConv.id}`).emit('message:new', message);

      // 4. DISPARAR INTELIGÊNCIA COMERCIAL (Se for mensagem do lead)
      if (!fromMe) {
        this.runIntelligencePipeline(updatedConv.lead, content, conv.id, ownerId);
      }

    } catch (err) {
      console.error('[WhatsApp Msg Sync Error]', err);
    }
  }

  /**
   * Roda o Motor SDR Alanis (3 Agentes + Memória) de forma assíncrona
   */
  async runIntelligencePipeline(lead, currentMessage, conversationId, ownerId) {
    try {
      const sdrService = require('./sdr.service');
      const pipelineResult = await sdrService.processMessage(lead.id, currentMessage);
      
      const { suggestedResponse, analysis, strategy, newTemperature } = pipelineResult;

      // Atualizar Lead no Banco com novos dados da IA
      const updatedLead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          temperature: newTemperature || lead.temperature,
          probability: analysis.probabilidade || lead.probability,
          consciousness: analysis.consciencia || lead.consciousness,
          summary: analysis.resumo || lead.summary,
          lastInteractionAt: new Date(),
          tags: { push: analysis.intencao }
        }
      });

      // Emitir via Socket para atualização imediata no front
      const io = getIO();
      io.to(`user:${ownerId}`).emit('ai:decision', {
        leadId: lead.id,
        conversationId,
        analysis,
        suggestedResponse,
        strategy
      });

      // Atualizar card no Kanban
      io.to(`user:${ownerId}`).emit('lead:update', updatedLead);

      console.log(`[Alanis SDR] Lead ${lead.name} processado. Temp: ${newTemperature}% | Prob: ${analysis.probabilidade}%`);
    } catch (err) {
      console.error('[Alanis SDR Error]', err.message);
    }
  }

  async resetSession() {
    console.log('[WhatsApp] Removendo sessão atual para hard reset...');
    this.status = 'DISCONNECTED';
    
    if (this.sock) {
      try { this.sock.logout(); } catch(e) {}
      this.sock = null;
    }

    const authPath = './baileys_auth_info';
    const fs = require('fs');
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log('[WhatsApp] Pasta de autenticação removida.');
    }

    // Re-inicializar para gerar novo QR
    return this.initialize(true);
  }

  getQR() { return this.qrCodeBase64; }
  getStatus() { return this.status; }
}

module.exports = new WhatsAppService();
