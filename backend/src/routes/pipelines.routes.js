const express = require('express');
const router = express.Router();
const pipelinesController = require('../controllers/pipelines.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', pipelinesController.getPipeline);
router.post('/stages', pipelinesController.addStage);
router.put('/stages/rename', pipelinesController.renameStage);
router.put('/stages/reorder', pipelinesController.reorderStages);
router.delete('/stages/:name', pipelinesController.deleteStage);
router.post('/reset', pipelinesController.resetPipeline);

module.exports = router;
