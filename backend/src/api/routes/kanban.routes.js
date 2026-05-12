const express = require('express');
const router = express.Router();
const kanbanController = require('../controllers/kanban.controller');

// Importando middleware de auth existente
const authMiddleware = require('../../../middlewares/auth.middleware');

router.use(authMiddleware);

// Endpoint ECC TDD
router.patch('/opportunities/:id/stage', kanbanController.moveOpportunity);

module.exports = router;
