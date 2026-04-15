const express = require('express');
const router = express.Router();
const prospectingController = require('../controllers/prospecting.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/start', prospectingController.startScrapingMission);
router.post('/sync', prospectingController.syncRun);
router.get('/status/:runId', prospectingController.getStatus);

module.exports = router;
