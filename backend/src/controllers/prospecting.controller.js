const axios = require('axios');
const prisma = require('../lib/prisma');
const intelligenceService = require('../services/intelligence.service');

exports.startScrapingMission = async (req, res) => {
  const { actorId, query, maxResults } = req.body;
  const token = process.env.APIFY_TOKEN;
  
  if (!token) {
    return res.status(400).json({ error: 'Token Apify (APIFY_TOKEN) não configurado no .env do servidor.' });
  }

  try {
    let input = {};

    // Configure input based on selected actor
    if (actorId === 'compass/crawler-google-places') {
      input = {
        searchStringsArray: [query],
        maxCrawledPlacesPerSearch: maxResults || 20,
        language: 'pt-BR',
        countryCode: 'br',
        location: query.includes(' em ') ? query.split(' em ').pop() : undefined
      };
    } else if (actorId === 'apify/instagram-profile-scraper') {
      input = {
        usernames: [query.replace('@', '')],
      };
    } else {
       // Fallback genérico se eles adicionarem novos atores
       input = { query, limit: maxResults || 20 };
    }

    console.log(`[Discovery] Iniciando missão no Apify (${actorId}) com query "${query}"...`);
    const apifyActorId = actorId.replace('/', '~');
    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/${apifyActorId}/runs?token=${token}`,
      input
    );

    const runId = runResponse.data.data.id;

    res.json({
      message: 'Missão iniciada com sucesso.',
      runId,
      status: 'RUNNING'
    });

  } catch (err) {
    const errorDetail = err.response?.data?.error?.message || err.message;
    console.error('[Discovery Error Full]', err.response?.data);
    res.status(500).json({ error: `Erro na API da Apify: ${errorDetail}` });
  }
};

exports.getStatus = async (req, res) => {
  const { runId } = req.params;
  const token = process.env.APIFY_TOKEN;

  if (!token) {
    return res.status(400).json({ error: 'APIFY_TOKEN ausente.' });
  }

  try {
    // Check status of the specific run
    const runResponse = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
    const status = runResponse.data.data.status;
    const defaultDatasetId = runResponse.data.data.defaultDatasetId;

    if (status === 'SUCCEEDED') {
      // Fetch the results
      const datasetResponse = await axios.get(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${token}`);
      
      // Map generic data so it always has at least name/email/category to show in the UI card
      const mappedItems = datasetResponse.data.map(item => {
        return {
          ...item,
          name: item.title || item.fullName || item.name || item.username,
          email: item.email || item.publicEmail || (item.emails && item.emails[0]),
          website: item.website || item.url,
          category: item.categoryName || item.industry || item.businessCategory,
          followersCount: item.followersCount,
          rating: item.totalScore || item.rating
        };
      });

      return res.json({ status, items: mappedItems });
    }

    // if RUNNING, READY, FAILED, TIMING-OUT, ABORTED, etc.
    res.json({ status });

  } catch (err) {
    console.error('[Discovery Status Error]', err.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao checar status da corrida.' });
  }
};

exports.syncRun = async (req, res) => {
  // Mantemos como retro-compatibilidade para caso no futuro eles queiram sincronizar do BD ao inves do client-side
  res.json({ imported: 0 });
};
