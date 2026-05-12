const express = require('express');
const router = express.Router();
const mc = require('../controllers/marketing.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Fallback para funções que ainda não existem no controller
const noop = (req, res) => res.status(501).json({ error: 'Endpoint ainda não implementado.' });

// OAuth Callbacks (public access, state contains JWT)
router.get('/meta/callback', mc.metaCallback || noop);
router.get('/google/callback', mc.googleCallback || noop);

router.use(authMiddleware);

router.get('/meta/accounts', mc.getAdAccounts || noop);
router.get('/ads/insights', mc.getAdInsights || noop);
router.post('/ads/sync', mc.syncAdInsights || noop);
router.get('/integrations', mc.getIntegrations || noop);
router.get('/connect/meta', mc.connectMetaAds || noop);
router.get('/connect/google', mc.connectGoogleAds || noop);
router.post('/ads/chat', mc.getMarketingChat || noop);

module.exports = router;
