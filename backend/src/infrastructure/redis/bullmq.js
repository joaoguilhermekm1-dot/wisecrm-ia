const { Queue } = require('bullmq');
const { redisConnection } = require('./redis.client');

// Fila da Inteligência Artificial (Alanis)
const aiQueue = new Queue('ai_analysis_queue', { connection: redisConnection });

// Fila de Sincronização do Meta Conversions API
const capiQueue = new Queue('meta_capi_queue', { connection: redisConnection });

module.exports = {
  aiQueue,
  capiQueue
};
