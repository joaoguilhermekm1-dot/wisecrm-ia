const axios = require('axios');
const prisma = require('../lib/prisma');
const intelligenceService = require('./intelligence.service');

class ApifyOrchestrator {
  constructor() {
    this.token = process.env.APIFY_TOKEN;
    this.apiUrl = 'https://api.apify.com/v2';
  }

  /**
   * Mapeia os dados brutos de diferentes atores para o formato de Lead do CRM.
   */
  normalizeLeadData(raw, type) {
    if (type === 'google-maps') {
      return {
        name: raw.title || raw.name,
        email: raw.email || (raw.emails && raw.emails[0]) || null,
        phone: raw.phone || null,
        source: 'Apify (Google Maps)',
        rawMessage: `Categoria: ${raw.categoryName} | Website: ${raw.website} | Rank: ${raw._rank}`,
        // Adicionais úteis
        address: raw.address,
        niche: raw.categoryName
      };
    }

    if (type === 'instagram') {
      return {
        name: raw.fullName || raw.username,
        email: raw.business_email || null,
        phone: raw.business_phone_number || null,
        source: 'Apify (Instagram)',
        rawMessage: `Bio: ${raw.biography} | Seguidores: ${raw.followersCount}`,
        niche: 'Social Profile'
      };
    }

    return null;
  }

  /**
   * Sincroniza um dataset completo para o CRM.
   */
  async syncDataset(datasetId, actorType, userId) {
    if (!this.token) return { imported: 0, error: 'Token Apify não configurado.' };

    try {
      console.log(`[Apify Sync] Sincronizando dataset ${datasetId} (${actorType})...`);
      const response = await axios.get(`${this.apiUrl}/datasets/${datasetId}/items?token=${this.token}`);
      const items = response.data;

      let importedCount = 0;

      for (const item of items) {
        const leadInfo = this.normalizeLeadData(item, actorType);
        if (!leadInfo) continue;

        // Tentar encontrar pipeline padrão
        let pipeline = await prisma.pipeline.findFirst({ where: { userId } });
        if (!pipeline) {
          pipeline = await prisma.pipeline.create({
            data: { name: 'Funil Wise', stages: ['Novo', 'Diagnóstico', 'Fechamento'], userId }
          });
        }

        // Criar Lead (com deduplicação simples por nome/email)
        const lead = await prisma.lead.upsert({
          where: { id: item.id || leadInfo.email || leadInfo.name }, // Se o item tiver ID único use-o
          update: {},
          create: {
            name: leadInfo.name,
            email: leadInfo.email,
            phone: leadInfo.phone,
            source: leadInfo.source,
            pipelineId: pipeline.id,
            ownerId: userId
          }
        }).catch(err => {
          // Se falhar o upsert por ID manual, tente criar normal
          return prisma.lead.create({
            data: {
              name: leadInfo.name,
              email: leadInfo.email,
              phone: leadInfo.phone,
              source: leadInfo.source,
              pipelineId: pipeline.id,
              ownerId: userId
            }
          });
        });

        // Trigger IA Intelligence para cada lead novo
        intelligenceService.analyzeLead(leadInfo).then(async (analysis) => {
          await prisma.message.create({
            data: {
              content: `🧠 ANÁLISE AUTOMÁTICA:\n${analysis.brain_insight}\n\nPrincípio: ${analysis.wise_principle}\n\nScore: ${analysis.qualification_score}%`,
              sender: 'ai',
              leadId: lead.id
            }
          });
        });

        importedCount++;
      }

      return { imported: importedCount };
    } catch (err) {
      console.error('[Apify Sync] Erro:', err.message);
      throw err;
    }
  }

  /**
   * Verifica execuções recentes de um Ator e sincroniza as terminadas.
   */
  async checkAndSyncRecentRuns(userId) {
    // Implementar lógica de varredura ativa de runs recentes
  }
}

module.exports = new ApifyOrchestrator();
