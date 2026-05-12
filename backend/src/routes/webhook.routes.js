const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Meta Webhook Verification and Reception
router.get('/meta', webhookController.verifyWebhook);
router.post('/meta', webhookController.handleIncoming);

// CAPI Server-Side Event Tracking (autenticado)
router.post('/track', authMiddleware, webhookController.trackEvent);

module.exports = router;
