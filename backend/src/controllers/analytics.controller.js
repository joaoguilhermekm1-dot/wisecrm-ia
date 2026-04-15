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

    const kpiData = {
      totalLeads, fechados, perdidos, leadsQuentes, avgTemp, taxaResposta
    };

    // Gera Insight de IA
    const aiInsight = await intelligenceService.agentAnalytics(kpiData);

    res.json({
      metrics: kpiData,
      ai_insight: aiInsight
    });
  } catch (err) {
    console.error('[Analytics Controller] Erro:', err);
    res.status(500).json({ error: 'Erro ao analisar métricas.' });
  }
};
