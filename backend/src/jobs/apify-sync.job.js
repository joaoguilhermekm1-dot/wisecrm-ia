const apifyOrchestrator = require('../services/apify.service');
const prisma = require('../lib/prisma');

/**
 * Job de Sincronização Automática Apify
 * Polla o Apify para encontrar execuções bem sucedidas e as importa para o CRM.
 */
function startApifySyncJob() {
  console.log('[Job] 🛰️ Iniciando monitoramento de prospecção do Apify...');

  // Roda a cada 5 minutos
  setInterval(async () => {
    try {
      // 1. Buscar todos os usuários (tenants) ativos
      const users = await prisma.user.findMany({ select: { id: true } });

      for (const user of users) {
        // Mock: Em produção, o service buscaria na API do Apify por runs recentes deste usuário.
        // Aqui, simulamos o polling para triggers do CRM.
        // apifyOrchestrator.checkAndSyncRecentRuns(user.id);
      }
    } catch (err) {
      console.error('[Job] Erro na sincronização Apify:', err.message);
    }
  }, 5 * 60 * 1000); 
}

module.exports = { startApifySyncJob };
