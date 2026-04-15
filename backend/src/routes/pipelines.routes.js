const express = require('express');
const router = express.Router();
const pipelinesController = require('../controllers/pipelines.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', pipelinesController.getPipeline);
router.patch('/stages', pipelinesController.updateStages);
router.post('/reset', pipelinesController.resetPipeline);

module.exports = router;
