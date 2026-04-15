const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Meta Webhook Verification and Reception
router.get('/meta', webhookController.verifyWebhook);
router.post('/meta', webhookController.handleIncoming);

module.exports = router;
