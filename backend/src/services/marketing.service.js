const axios = require('axios');
const prisma = require('../lib/prisma');

class MarketingService {
  /**
   * Sincroniza métricas reais da Meta Marketing API (Adveronix Style)
   * @param {string} userId - ID do usuário no CRM
   * @param {string} adAccountId - ID da conta de anúncios (act_...)
   * @param {number} daysBack - Quantos dias de histórico puxar
   */
  async syncMetaMetrics(userId, adAccountId, daysBack = 7) {
    try {
      const integration = await prisma.integration.findUnique({
        where: { type_userId: { type: 'META', userId } }
      });

      if (!integration || !integration.accessToken) {
        throw new Error('Integração Meta não ativa para este usuário.');
      }

      // 1. Definir o range de datas
      const datePresets = {
        '0': 'today',
        '1': 'yesterday',
        '7': 'last_7d',
        '30': 'last_30d'
      };

      const datePreset = datePresets[daysBack] || 'last_7d';

      // 2. Chamar a Graph API
      // Documentação: https://developers.facebook.com/docs/marketing-api/reference/ad-account/insights/
      const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights`;
      
      const response = await axios.get(url, {
        params: {
          access_token: integration.accessToken,
          level: 'account',
          date_preset: datePreset,
          time_increment: 1, // Retorna dia a dia para o histórico Adveronix
          fields: 'clicks,impressions,spend,reach,cpc,cpm,inline_link_click_ctr,account_name,date_start'
        }
      });

      const insights = response.data.data;
      console.log(`[Marketing Sync] Recebidos ${insights.length} dias de dados para ${adAccountId}`);

      // 3. Persistir no Banco de Dados
      for (const day of insights) {
        const date = new Date(day.date_start);
        
        await prisma.adMetric.upsert({
          where: {
            date_accountId_userId: {
              date,
              accountId: adAccountId,
              userId
            }
          },
          update: {
            clicks: parseInt(day.clicks || 0),
            impressions: parseInt(day.impressions || 0),
            spend: parseFloat(day.spend || 0),
            reach: parseInt(day.reach || 0),
            cpc: parseFloat(day.cpc || 0),
            cpm: parseFloat(day.cpm || 0),
            ctr: parseFloat(day.inline_link_click_ctr || 0),
            accountName: day.account_name
          },
          create: {
            date,
            clicks: parseInt(day.clicks || 0),
            impressions: parseInt(day.impressions || 0),
            spend: parseFloat(day.spend || 0),
            reach: parseInt(day.reach || 0),
            cpc: parseFloat(day.cpc || 0),
            cpm: parseFloat(day.cpm || 0),
            ctr: parseFloat(day.inline_link_click_ctr || 0),
            accountId: adAccountId,
            accountName: day.account_name,
            userId
          }
        });
      }

      // --- CAMPAIGN LEVEL ---
      try {
        const campaignRes = await axios.get(url, {
          params: {
            access_token: integration.accessToken,
            level: 'campaign',
            date_preset: datePreset,
            time_increment: 1,
            fields: 'clicks,impressions,spend,reach,cpc,cpm,inline_link_click_ctr,campaign_id,campaign_name'
          }
        });

        for (const camp of campaignRes.data.data) {
          const date = new Date(camp.date_start);
          await prisma.adCampaignMetric.upsert({
            where: {
              date_campaignId_accountId_userId: {
                date,
                campaignId: camp.campaign_id,
                accountId: adAccountId,
                userId
              }
            },
            update: {
              clicks: parseInt(camp.clicks || 0),
              impressions: parseInt(camp.impressions || 0),
              spend: parseFloat(camp.spend || 0),
              reach: parseInt(camp.reach || 0),
              cpc: parseFloat(camp.cpc || 0),
              cpm: parseFloat(camp.cpm || 0),
              ctr: parseFloat(camp.inline_link_click_ctr || 0),
              campaignName: camp.campaign_name
            },
            create: {
              date,
              clicks: parseInt(camp.clicks || 0),
              impressions: parseInt(camp.impressions || 0),
              spend: parseFloat(camp.spend || 0),
              reach: parseInt(camp.reach || 0),
              cpc: parseFloat(camp.cpc || 0),
              cpm: parseFloat(camp.cpm || 0),
              ctr: parseFloat(camp.inline_link_click_ctr || 0),
              campaignId: camp.campaign_id,
              campaignName: camp.campaign_name,
              accountId: adAccountId,
              userId
            }
          });
        }
      } catch(campErr) {
        console.error('[Marketing Sync] Failed to fetch campaign level data', campErr.message);
      }

      // --- AD LEVEL ---
      try {
        const adRes = await axios.get(url, {
          params: {
            access_token: integration.accessToken,
            level: 'ad',
            date_preset: datePreset,
            time_increment: 1,
            // To be faster, only fetch top ads or limit
            limit: 500,
            fields: 'clicks,impressions,spend,reach,cpc,cpm,inline_link_click_ctr,ad_id,ad_name,campaign_name'
          }
        });

        for (const ad of adRes.data.data) {
          const date = new Date(ad.date_start);
          await prisma.adCreativeMetric.upsert({
            where: {
              date_adId_accountId_userId: {
                date,
                adId: ad.ad_id,
                accountId: adAccountId,
                userId
              }
            },
            update: {
              clicks: parseInt(ad.clicks || 0),
              impressions: parseInt(ad.impressions || 0),
              spend: parseFloat(ad.spend || 0),
              reach: parseInt(ad.reach || 0),
              cpc: parseFloat(ad.cpc || 0),
              cpm: parseFloat(ad.cpm || 0),
              ctr: parseFloat(ad.inline_link_click_ctr || 0),
              adName: ad.ad_name,
              campaignName: ad.campaign_name
            },
            create: {
              date,
              clicks: parseInt(ad.clicks || 0),
              impressions: parseInt(ad.impressions || 0),
              spend: parseFloat(ad.spend || 0),
              reach: parseInt(ad.reach || 0),
              cpc: parseFloat(ad.cpc || 0),
              cpm: parseFloat(ad.cpm || 0),
              ctr: parseFloat(ad.inline_link_click_ctr || 0),
              adId: ad.ad_id,
              adName: ad.ad_name,
              campaignName: ad.campaign_name,
              accountId: adAccountId,
              userId
            }
          });
        }
      } catch(adErr) {
        console.error('[Marketing Sync] Failed to fetch ad level data', adErr.message);
      }

      return { success: true, count: insights.length };
    } catch (err) {
      console.error('[Marketing Sync Error]', err.response?.data || err.message);
      // Retornamos fallback para não crashar o front se o token expirar
      return { success: false, error: err.message };
    }
  }

  /**
   * Retorna o histórico formatado para o gráfico do Frontend
   */
  async getHistory(userId, adAccountId, customStartDate = null, customEndDate = null) {
    let whereClause = { userId, accountId: adAccountId };
    if (customStartDate || customEndDate) {
      whereClause.date = {};
      if (customStartDate) whereClause.date.gte = new Date(customStartDate);
      if (customEndDate) whereClause.date.lte = new Date(customEndDate);
    }
    
    return await prisma.adMetric.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
      take: 90
    });
  }

  async getCampaigns(userId, adAccountId, customStartDate = null, customEndDate = null) {
    let whereClause = { userId, accountId: adAccountId };
    if (customStartDate || customEndDate) {
      whereClause.date = {};
      if (customStartDate) whereClause.date.gte = new Date(customStartDate);
      if (customEndDate) whereClause.date.lte = new Date(customEndDate);
    }
    
    // Group campaigns and aggregate sums
    const metricGroups = await prisma.adCampaignMetric.groupBy({
      by: ['campaignId', 'campaignName'],
      where: whereClause,
      _sum: {
        clicks: true,
        impressions: true,
        spend: true,
        reach: true,
      }
    });

    return metricGroups.map(c => ({
      campaignId: c.campaignId,
      name: c.campaignName || 'Campanha Desconhecida',
      clicks: c._sum.clicks || 0,
      impressions: c._sum.impressions || 0,
      spend: c._sum.spend || 0,
      reach: c._sum.reach || 0,
      // Se spend for muito alto sem clicks, o status pode ser ajustado. No MVP marcamos como ativo por agora
      status: 'Active' 
    }));
  }

  async getTopAds(userId, adAccountId, customStartDate = null, customEndDate = null) {
    let whereClause = { userId, accountId: adAccountId };
    if (customStartDate || customEndDate) {
      whereClause.date = {};
      if (customStartDate) whereClause.date.gte = new Date(customStartDate);
      if (customEndDate) whereClause.date.lte = new Date(customEndDate);
    }
    
    // Group Ads
    const adGroups = await prisma.adCreativeMetric.groupBy({
      by: ['adId', 'adName', 'campaignName'],
      where: whereClause,
      _sum: {
        clicks: true,
        spend: true,
        impressions: true
      },
      orderBy: {
        _sum: {
          clicks: 'desc'
        }
      },
      take: 10
    });

    return adGroups.map(a => ({
      adId: a.adId,
      name: a.adName || 'Anúncio Desconhecido',
      campaignName: a.campaignName || 'Desconhecida',
      clicks: a._sum.clicks || 0,
      spend: a._sum.spend || 0,
      impressions: a._sum.impressions || 0
    }));
  }
}

module.exports = new MarketingService();
