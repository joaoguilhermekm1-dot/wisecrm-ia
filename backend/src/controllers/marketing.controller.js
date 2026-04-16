const marketingService = require('../services/marketing.service');

const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const axios = require('axios');

exports.connectMetaAds = (req, res) => {
  const userId = req.user.userId;
  // Gerar um state token com JWT para segurança contra CSRF e para passar o userId
  const state = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const appId = process.env.META_APP_ID;
  const backendUrl = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
  const redirectUri = `${backendUrl}/api/marketing/meta/callback`;
  
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=ads_management,ads_read`;
  res.json({ url });
};

exports.connectGoogleAds = (req, res) => {
  const userId = req.user.userId;
  const state = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const backendUrl = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
  const redirectUri = `${backendUrl}/api/marketing/google/callback`;

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/adwords&state=${state}&access_type=offline&prompt=consent`;
  res.json({ url });
};

exports.getAdAccounts = async (req, res) => {
  const userId = req.user.userId;
  try {
    const integrations = await prisma.integration.findMany({
      where: { 
        userId,
        type: { in: ['META', 'GOOGLE'] },
        status: 'CONNECTED'
      }
    });

    if (integrations.length === 0) {
      return res.json([]);
    }

    let allAccounts = [];

    for (const integration of integrations) {
      if (integration.type === 'META') {
        try {
          const response = await axios.get(`https://graph.facebook.com/v19.0/me/adaccounts`, {
            params: {
              access_token: integration.accessToken,
              fields: 'name,id,account_status'
            }
          });
          const metaAccs = response.data.data.map(acc => ({
            ...acc,
            platform: 'META',
            displayName: `[META] ${acc.name}`
          }));
          allAccounts = [...allAccounts, ...metaAccs];
        } catch (e) {
          // Fallback if token expired but still marked as connected
          allAccounts.push({ id: 'act_mock_meta', name: 'Wise Company (Meta Mock)', platform: 'META', displayName: '[META] Wise Company (Demo)' });
        }
      } else if (integration.type === 'GOOGLE') {
        // Para Google Ads, geralmente precisamos do customer_id. 
        // No MVP, se não temos o developer_token para o list_accessible_customers, mockamos a conta vinculada.
        allAccounts.push({ 
          id: integration.metadata?.accountId || 'g-ads-customer-1', 
          name: integration.metadata?.accountName || 'Google Ads Account', 
          platform: 'GOOGLE',
          displayName: `[GOOGLE] ${integration.metadata?.accountName || 'Google Ads Account'}`
        });
      }
    }

    return res.json(allAccounts);
  } catch (err) {
    console.error('[getAdAccounts Error]', err);
    res.status(500).json({ error: 'Erro ao buscar contas de anúncio.' });
  }
};

exports.getAdInsights = async (req, res) => {
  const userId = req.user.userId;
  const { adAccountId, platform, startDate, endDate } = req.query;
  
  if (!adAccountId) return res.status(400).json({ error: 'Conta de anúncio não especificada.' });

  try {
    // 1. Sincronizar dados reais (Background) se for Meta e não tiver dados recentes
    if (platform === 'META') {
      await marketingService.syncMetaMetrics(userId, adAccountId, 30);
    } else if (platform === 'GOOGLE') {
      await marketingService.syncGoogleMetrics(userId, adAccountId);
    }

    // 2. Buscar histórico do banco (com filtro opcional de data)
    const history = await marketingService.getHistory(userId, adAccountId, startDate, endDate);
    
    // 3. Buscar métricas agrupadas por campanhas e anúncios para a UI
    const campaigns = await marketingService.getCampaigns(userId, adAccountId, startDate, endDate);
    const topAds = await marketingService.getTopAds(userId, adAccountId, startDate, endDate);

    // 4. Formatar resposta para o Frontend
    const latest = history[history.length - 1] || {};
    const yesterday = history[history.length - 2] || {};

    const insights = {
      primaryMetrics: {
        messagesStarted: latest.clicks || 0,
        costPerMessage: latest.cpc || 0,
        clicks: latest.clicks || 0,
        ctr: latest.ctr || 0,
        cpc: latest.cpc || 0,
        cpm: latest.cpm || 0,
        change: {
          clicks: yesterday.clicks ? (((latest.clicks - yesterday.clicks) / yesterday.clicks) * 100).toFixed(1) : 0
        }
      },
      funnel: {
        reach: latest.reach || 0,
        clicks: latest.clicks || 0,
        spend: latest.spend || 0
      },
      history: history.map(h => ({
        date: h.date.toISOString().split('T')[0],
        spend: h.spend,
        clicks: h.clicks
      })),
      campaigns,
      topAds
    };
    
    res.json(insights);
  } catch (err) {
    console.error('[Marketing Controller] Error:', err);
    res.status(500).json({ error: 'Erro ao processar insights de marketing.' });
  }
};

exports.syncAdInsights = async (req, res) => {
  const userId = req.user.userId;
  const { adAccountId, platform } = req.body;
  if (!adAccountId) return res.status(400).json({ error: 'Conta de anúncio não especificada.' });

  try {
    let result;
    if (platform === 'GOOGLE') {
      result = await marketingService.syncGoogleMetrics(userId, adAccountId);
    } else {
      result = await marketingService.syncMetaMetrics(userId, adAccountId, 30);
    }

    if (!result.success) {
       return res.status(400).json({ error: result.error || 'Erro ao sincronizar dados.' });
    }
    res.json({ message: result.message || 'Sincronizado com sucesso!', count: result.count });
  } catch (err) {
    console.error('[Sync Insights Error]', err);
    res.status(500).json({ error: 'Erro interno ao sincronizar.' });
  }
};

exports.getIntegrations = async (req, res) => {
  const userId = req.user.userId;
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId }
    });
    res.json(integrations);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar integrações.' });
  }
};

exports.metaCallback = async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
     return res.redirect(`${frontendUrl}/marketing?error=auth_denied`);
  }

  try {
    // 1. Decode state (JWT token)
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 2. Exchange Code for Token
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const backendUrl = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
    const redirectUri = `${backendUrl}/api/marketing/meta/callback`;

    const tokenRes = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
      params: {
        client_id: appId,
        redirect_uri: redirectUri,
        client_secret: appSecret,
        code: code
      }
    });

    const { access_token } = tokenRes.data;

    // 3. Persist Real Token in DB
    await prisma.integration.upsert({
      where: { type_userId: { type: 'META', userId } },
      update: { accessToken: access_token, status: 'CONNECTED' },
      create: { type: 'META', userId, accessToken: access_token, status: 'CONNECTED' }
    });

    res.redirect(`${frontendUrl}/marketing?meta_connected=true`);
  } catch (err) {
    console.error('[Meta Callback Error]', err.response?.data || err.message);
    res.redirect(`${frontendUrl}/marketing?error=callback_failed`);
  }
};

exports.googleCallback = async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
     return res.redirect(`${frontendUrl}/marketing?error=auth_denied`);
  }

  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 2. Exchange Code for Token
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const backendUrl = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
    const redirectUri = `${backendUrl}/api/marketing/google/callback`;

    const tokenRes = await axios.post(`https://oauth2.googleapis.com/token`, {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token } = tokenRes.data;

    await prisma.integration.upsert({
      where: { type_userId: { type: 'GOOGLE', userId } },
      update: { 
        accessToken: access_token, 
        refreshToken: refresh_token || undefined,
        status: 'CONNECTED' 
      },
      create: { 
        type: 'GOOGLE', 
        userId, 
        accessToken: access_token, 
        refreshToken: refresh_token,
        status: 'CONNECTED' 
      }
    });

    res.redirect(`${frontendUrl}/marketing?google_connected=true`);
  } catch (err) {
    console.error('[Google Callback Error]', err.response?.data || err.message);
    res.redirect(`${frontendUrl}/marketing?error=callback_failed`);
  }
};

exports.getMarketingChat = async (req, res) => {
  const userId = req.user.userId;
  const { adAccountId, startDate, endDate, history } = req.body;
  
  if (!adAccountId) return res.status(400).json({ error: 'Conta de anúncio não especificada.' });

  try {
    // 1. Opcional: não precisamos sincronizar toda vez que ele fala com o chat para não ser lento.
    // Puxamos do banco o compilado do que ele está selecionando na tela agora.
    const adHistory = await marketingService.getHistory(userId, adAccountId, startDate, endDate);
    const campaigns = await marketingService.getCampaigns(userId, adAccountId, startDate, endDate);
    
    const latest = adHistory[adHistory.length - 1] || {};
    const insightsPayload = {
      primaryMetrics: {
        clicks: latest.clicks || 0,
        cpc: latest.cpc || 0,
        spend: latest.spend || 0,
        ctr: latest.ctr || 0
      },
      funnel: {
        reach: latest.reach || 0,
        spend: latest.spend || 0
      },
      campaigns
    };

    const intelligenceService = require('../services/intelligence.service');
    const response = await intelligenceService.getMarketingSuggestion(insightsPayload, history || []);
    
    res.json(response);
  } catch(err) {
    console.error('[Marketing Chat API Error]', err.message);
    res.status(500).json({ error: 'Erro ao gerar insight estratégico.' });
  }
};
