const prisma = require('../lib/prisma');
const intelligenceService = require('../services/intelligence.service');

exports.getGlobalMetrics = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const allLeads = await prisma.lead.findMany({
      where: { ownerId },
      select: { status: true, temperature: true, messages: { select: { id: true, sender: true } } }
    });

    const CLOSED_STATUS = ['FECHADO', 'FECHAMENTO', 'WON', 'GANHO', 'ATIVO', 'CONVERTIDO'];
    const LOST_STATUS   = ['PERDIDO', 'LOST', 'CANCELADO', 'DESQUALIFICADO'];

    const totalLeads = allLeads.length;
    const fechados = allLeads.filter(l => CLOSED_STATUS.includes((l.status || '').toUpperCase())).length;
    const perdidos = allLeads.filter(l => LOST_STATUS.includes((l.status || '').toUpperCase())).length;
    const leadsQuentes = allLeads.filter(l => l.temperature >= 70).length;

    // Calculando a média de temperatura dos leads ativos (não fechados/perdidos)
    const activeLeads = allLeads.filter(l => !CLOSED_STATUS.includes((l.status || '').toUpperCase()) && !LOST_STATUS.includes((l.status || '').toUpperCase()));
    const avgTemp = activeLeads.length 
        ? Math.round(activeLeads.reduce((acc, l) => acc + l.temperature, 0) / activeLeads.length)
        : 0;

    // Taxa de resposta: leads que mandaram pelo menos 1 mensagem
    const respondedLeads = allLeads.filter(l => l.messages.some(m => m.sender === 'lead')).length;
    const taxaResposta = totalLeads ? Math.round((respondedLeads / totalLeads) * 100) : 0;

    // Métricas de Marketing (Gasto e Cliques)
    const [adMetrics, manualMetrics] = await Promise.all([
      prisma.adMetric.aggregate({
        where: { userId: ownerId },
        _sum: { spend: true, clicks: true }
      }),
      prisma.manualAdMetric.aggregate({
        where: { userId: ownerId },
        _sum: { spend: true, clicks: true }
      })
    ]);

    const totalSpend = (adMetrics._sum.spend || 0) + (manualMetrics._sum.spend || 0);
    const totalClicks = (adMetrics._sum.clicks || 0) + (manualMetrics._sum.clicks || 0);

    const kpiData = {
      totalLeads, 
      fechados, 
      perdidos, 
      leadsQuentes, 
      avgTemp, 
      taxaResposta,
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalClicks
    };

    // Gera Insight de IA
    let aiInsight = null;
    try {
      aiInsight = await intelligenceService.agentAnalytics(kpiData);
    } catch (aiErr) {
      console.warn('[Analytics IA] Falha ao gerar insight:', aiErr.message);
      aiInsight = { 
        diagnostico_erro: "Análise IA indisponível no momento.",
        solucao_rapida: "Verifique suas métricas manualmente.",
        plano_acao: "Tente novamente em alguns instantes."
      };
    }

    res.json({
      metrics: kpiData,
      ai_insight: aiInsight
    });
  } catch (err) {
    console.error('[Analytics Controller] Erro:', err);
    res.status(500).json({ error: 'Erro ao analisar métricas.' });
  }
};
