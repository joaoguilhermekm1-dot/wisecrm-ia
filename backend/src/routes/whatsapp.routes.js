const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp.service');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/status', (req, res) => {
  const status = whatsappService.getStatus();
  const qr = whatsappService.getQR();
  
  res.json({ status, qr });
});

router.post('/start', async (req, res) => {
  const status = whatsappService.getStatus();
  if (status === 'DISCONNECTED') {
    await whatsappService.initialize(true);
  }
  res.json({ message: 'Motor de WhatsApp Iniciado' });
});

router.post('/reset', async (req, res) => {
  try {
    await whatsappService.resetSession();
    res.json({ message: 'Sessão reiniciada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao reiniciar sessão' });
  }
});

module.exports = router;
