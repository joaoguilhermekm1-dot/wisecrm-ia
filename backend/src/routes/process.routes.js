const express = require('express');
const router = express.Router();
const processController = require('../controllers/process.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', processController.getProcesses);
router.post('/generate', processController.generateFromNote);
router.post('/save', processController.saveProcess);
router.post('/execute', processController.executeNodeAction);

module.exports = router;
