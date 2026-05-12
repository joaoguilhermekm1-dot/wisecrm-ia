const prisma = require('../lib/prisma');

exports.getMetrics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { platform, startDate, endDate } = req.query;

    let where = { userId };
    
    if (platform) {
      where.platform = platform;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const metrics = await prisma.manualAdMetric.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    res.json(metrics);
  } catch (error) {
    console.error('[getMetrics Error]', error);
    res.status(500).json({ error: 'Erro ao buscar métricas manuais' });
  }
};

exports.createMetric = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      date,
      platform,
      accountName,
      campaignName,
      impressions,
      clicks,
      spend,
      conversions,
      reach,
      leads,
      messages
    } = req.body;

    if (!date || !platform || !accountName) {
      return res.status(400).json({ error: 'Data, plataforma e nome da conta são obrigatórios.' });
    }

    // Calcular métricas derivadas
    const parsedImpressions = parseInt(impressions) || 0;
    const parsedClicks = parseInt(clicks) || 0;
    const parsedSpend = parseFloat(spend) || 0;
    
    const ctr = parsedImpressions > 0 ? (parsedClicks / parsedImpressions) * 100 : 0;
    const cpc = parsedClicks > 0 ? parsedSpend / parsedClicks : 0;
    const cpm = parsedImpressions > 0 ? (parsedSpend / parsedImpressions) * 1000 : 0;

    const metric = await prisma.manualAdMetric.upsert({
      where: {
        date_platform_accountName_userId: {
          date: new Date(date),
          platform,
          accountName,
          userId
        }
      },
      update: {
        campaignName,
        impressions: parsedImpressions,
        clicks: parsedClicks,
        spend: parsedSpend,
        conversions: parseInt(conversions) || 0,
        reach: parseInt(reach) || 0,
        leads: parseInt(leads) || 0,
        messages: parseInt(messages) || 0,
        ctr,
        cpc,
        cpm
      },
      create: {
        userId,
        date: new Date(date),
        platform,
        accountName,
        campaignName,
        impressions: parsedImpressions,
        clicks: parsedClicks,
        spend: parsedSpend,
        conversions: parseInt(conversions) || 0,
        reach: parseInt(reach) || 0,
        leads: parseInt(leads) || 0,
        messages: parseInt(messages) || 0,
        ctr,
        cpc,
        cpm
      }
    });

    res.json(metric);
  } catch (error) {
    console.error('[createMetric Error]', error);
    res.status(500).json({ error: 'Erro ao salvar métrica manual' });
  }
};

exports.updateMetric = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updateData = req.body;

    // Se estivermos atualizando cliques, impressões ou gasto, recalcular CTR, CPC, CPM
    const existingMetric = await prisma.manualAdMetric.findFirst({
      where: { id, userId }
    });

    if (!existingMetric) {
      return res.status(404).json({ error: 'Métrica não encontrada' });
    }

    const impressions = updateData.impressions !== undefined ? parseInt(updateData.impressions) : existingMetric.impressions;
    const clicks = updateData.clicks !== undefined ? parseInt(updateData.clicks) : existingMetric.clicks;
    const spend = updateData.spend !== undefined ? parseFloat(updateData.spend) : existingMetric.spend;

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

    const metric = await prisma.manualAdMetric.update({
      where: { id },
      data: {
        ...updateData,
        impressions,
        clicks,
        spend,
        ctr,
        cpc,
        cpm,
        conversions: updateData.conversions !== undefined ? parseInt(updateData.conversions) : existingMetric.conversions,
        reach: updateData.reach !== undefined ? parseInt(updateData.reach) : existingMetric.reach,
        leads: updateData.leads !== undefined ? parseInt(updateData.leads) : existingMetric.leads,
        messages: updateData.messages !== undefined ? parseInt(updateData.messages) : existingMetric.messages,
        date: updateData.date ? new Date(updateData.date) : existingMetric.date
      }
    });

    res.json(metric);
  } catch (error) {
    console.error('[updateMetric Error]', error);
    res.status(500).json({ error: 'Erro ao atualizar métrica manual' });
  }
};

exports.deleteMetric = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await prisma.manualAdMetric.delete({
      where: {
        id,
        userId // Garantir que só pode deletar as próprias métricas (Prisma client limitation for delete where with compound, using deleteMany as safer alternative)
      }
    });

    res.json({ success: true });
  } catch (error) {
    // If it fails because of the strict `id` delete, we can use deleteMany
    try {
        await prisma.manualAdMetric.deleteMany({
            where: {
                id,
                userId
            }
        });
        res.json({ success: true });
    } catch (innerError) {
        console.error('[deleteMetric Error]', innerError);
        res.status(500).json({ error: 'Erro ao excluir métrica manual' });
    }
  }
};
