const { Worker } = require('bullmq');
const { redisConnection } = require('../infrastructure/redis/redis.client');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const axios = require('axios'); // Vamos usar axios para as requests pro Meta

const prisma = new PrismaClient();

/**
 * Worker do Meta CAPI (Conversions API)
 * Disparado de forma assíncrona para não atrasar a resposta da API (ex: no webhook ou kanban)
 */
const capiWorker = new Worker('meta_capi_queue', async job => {
  const { eventName, eventTime, leadData, companyId, adMetricId } = job.data;
  console.log(`[CAPI Worker] Processando evento ${eventName} para Company ${companyId}`);

  try {
    // 1. Resgatar as chaves da Company (Token e Pixel ID)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { 
        metaPixelId: true,
        metaAccessToken: true
      }
    });

    if (!company || !company.metaPixelId || !company.metaAccessToken) {
      console.warn(`[CAPI Worker] Empresa ${companyId} sem Pixel/Token configurado.`);
      return { success: false, reason: 'missing_credentials' };
    }

    // 2. Hashar dados sensíveis do usuário (Exigência do Facebook CAPI)
    const hashData = (str) => {
      if (!str) return undefined;
      return crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');
    };

    const userData = {
      ph: hashData(leadData.phone), // Telefone (obrigatório para WhatsApp leads)
      em: hashData(leadData.email), // Email (se houver)
      fn: hashData(leadData.firstName),
      // client_user_agent, fbp, fbc poderiam ser resgatados do tracking
    };

    // 3. Montar Payload do Evento
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: eventTime || Math.floor(Date.now() / 1000),
          action_source: "system_generated",
          user_data: userData,
          custom_data: {
            lead_id: leadData.id,
            pipeline_stage: leadData.stageName
          }
        }
      ]
    };

    // 4. Disparar para a API do Graph do Facebook
    const FB_GRAPH_URL = `https://graph.facebook.com/v19.0/${company.metaPixelId}/events`;
    
    const response = await axios.post(FB_GRAPH_URL, payload, {
      params: { access_token: company.metaAccessToken }
    });

    console.log(`[CAPI Worker] Evento enviado com sucesso! FB Trace ID: ${response.data.fbtrace_id}`);
    
    // Opcional: Atualizar a tabela AdMetric incrementando os leads CAPI gerados
    if (adMetricId) {
      await prisma.adMetric.update({
        where: { id: adMetricId },
        data: {
          capiEventsSent: { increment: 1 }
        }
      });
    }

    return response.data;
  } catch (error) {
    console.error(`[CAPI Worker] Erro ao enviar evento para Meta:`, error.response?.data || error.message);
    throw error; // Re-joga o erro pro BullMQ tentar novamente caso seja configurado retry
  }
}, { connection: redisConnection });

capiWorker.on('failed', (job, err) => {
  console.error(`[CAPI Worker] Job CAPI falhou: ${err.message}`);
});

module.exports = { capiWorker };
