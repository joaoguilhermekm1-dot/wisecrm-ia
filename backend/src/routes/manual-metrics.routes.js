const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const manualMetricsController = require('../controllers/manual-metrics.controller');

router.use(authMiddleware);

router.get('/', manualMetricsController.getMetrics);
router.post('/', manualMetricsController.createMetric);
router.put('/:id', manualMetricsController.updateMetric);
router.delete('/:id', manualMetricsController.deleteMetric);

module.exports = router;
