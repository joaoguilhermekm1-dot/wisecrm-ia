const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leads.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/conversations', leadsController.getConversations);
router.get('/', leadsController.getLeads);
router.post('/', leadsController.createLead);
router.post('/batch', leadsController.createLeadsBatch);
router.patch('/:id', leadsController.updateLead);
router.delete('/:id', leadsController.deleteLead);

// Messages sub-routes
router.get('/:id/messages', leadsController.getMessages);
router.post('/:id/messages', leadsController.sendMessage);
router.get('/:id/ai-suggestion', leadsController.getAISuggestion);
router.get('/:id/smart-templates', leadsController.getSmartTemplates);


module.exports = router;
