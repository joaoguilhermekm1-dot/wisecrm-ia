const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketing.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// OAuth Callbacks (public access, state contains JWT)
router.get('/meta/callback', marketingController.metaCallback);
router.get('/google/callback', marketingController.googleCallback);

router.use(authMiddleware);

router.get('/meta/accounts', marketingController.getAdAccounts);
router.get('/ads/insights', marketingController.getAdInsights);
router.post('/ads/sync', marketingController.syncMetaInsights);
router.get('/integrations', marketingController.getIntegrations);
router.get('/connect/meta', marketingController.connectMetaAds);
router.get('/connect/google', marketingController.connectGoogleAds);
router.post('/ads/chat', marketingController.getMarketingChat);

module.exports = router;
