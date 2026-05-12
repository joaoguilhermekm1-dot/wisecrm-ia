const { Worker } = require('bullmq');
const { redisConnection } = require('../infrastructure/redis/redis.client');
const { PrismaClient } = require('@prisma/client');
const { ChatAnthropic } = require('@langchain/anthropic');

const prisma = new PrismaClient();

const alanisSystemPrompt = `
Você é a Alanis V3, IA SDR e Estrategista da Wise Company.
O seu papel não é vender por preço, mas ancorar valor e diagnosticar de forma consultiva (Metodologia BLOD).
Você atua como co-piloto do SDR. Analise o perfil DISC do lead baseado na mensagem recebida, 
e gere um 'rationale' com sua sugestão de resposta. Lembre-se: 'O extraordinário não nasce do óbvio'.
Retorne EXCLUSIVAMENTE um JSON com as chaves: "intent", "suggestedReply", "reasoning", "discEstimate".
`;

// Inicializando o modelo
const chatModel = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  modelName: "claude-3-5-sonnet-20241022",
  temperature: 0.2,
});

const aiWorker = new Worker('ai_analysis_queue', async job => {
  const { leadId, messageId } = job.data;
  console.log(`[AlanisWorker] Iniciando análise para mensagem ${messageId}`);

  try {
    // Buscar histórico do lead (últimas 10 mensagens)
    const messages = await prisma.message.findMany({
      where: { leadId },
      orderBy: { timestamp: 'asc' },
      take: 10
    });

    const conversationContext = messages.map(m => `${m.sender}: ${m.content}`).join('\n');
    
    const prompt = `${alanisSystemPrompt}\n\nHistórico:\n${conversationContext}\n\nBaseado na última mensagem do LEAD, qual a sugestão de resposta?`;
    
    // Chamar a API da Anthropic
    const response = await chatModel.invoke(prompt);
    
    let parsedResponse = null;
    try {
       // O model deve retornar um JSON válido se dermos a instrução correta,
       // extrair apenas as chaves JSON.
       const rawText = response.content;
       const jsonMatch = rawText.match(/\{[\s\S]*\}/);
       if (jsonMatch) {
         parsedResponse = JSON.parse(jsonMatch[0]);
       }
    } catch(e) {
       console.error('[AlanisWorker] Falha no Parse do JSON', e);
    }

    if (parsedResponse) {
       // Atualiza a Message com a análise (rationale)
       await prisma.message.update({
         where: { id: messageId },
         data: { aiRationale: parsedResponse }
       });

       // Emite evento via socket local ou redis pub/sub
       // Exemplo: redisConnection.publish('alanis_insight', JSON.stringify({ messageId, parsedResponse }));
    }

    return parsedResponse;
  } catch (error) {
    console.error(`[AlanisWorker] Erro crítico no job ${job.id}:`, error);
    throw error;
  }
}, { connection: redisConnection });

aiWorker.on('completed', job => {
  console.log(`[AlanisWorker] Job ${job.id} concluído com sucesso`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`[AlanisWorker] Job ${job.id} falhou com erro: ${err.message}`);
});

module.exports = { aiWorker };
