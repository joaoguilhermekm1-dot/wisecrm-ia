const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const { initSocket } = require('./lib/socket');
const { startApifySyncJob } = require('./jobs/apify-sync.job');
require('dotenv').config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, origin);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Rate Limiting (Aumentado para permitir polling de status)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Muitas requisições do mesmo IP, tente novamente em 15 minutos.' }
});
app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Wise CRM IA Backend' 
  });
});

// Import Routes
const authRoutes = require('./routes/auth.routes');
const leadsRoutes = require('./routes/leads.routes');
const prospectingRoutes = require('./routes/prospecting.routes');
const webhookRoutes = require('./routes/webhook.routes');
const processRoutes = require('./routes/process.routes');
const marketingRoutes = require('./routes/marketing.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const pipelinesRoutes = require('./routes/pipelines.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const uploadRoutes = require('./routes/upload.routes');

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/prospecting', prospectingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/pipelines', pipelinesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// Serivir mídias estáticas
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Iniciar Jobs de Background
startApifySyncJob();

const automationService = require('./services/automation.service');
automationService.start();

// Retomar conexão do WhatsApp apenas se existirem credenciais salvas
const fs = require('fs');
const whatsappService = require('./services/whatsapp.service');
const authPath = path.join(__dirname, '..', 'baileys_auth_info');

if (fs.existsSync(authPath) && fs.readdirSync(authPath).length > 0) {
  console.log('[WhatsApp Autostart] Sessão encontrada, retomando conexão silenciosamente...');
  whatsappService.initialize(false).catch(err => console.error('[WhatsApp Autostart Error]', err));
} else {
  console.log('[WhatsApp Autostart] Nenhuma sessão ativa encontrada. Aguardando comando manual.');
}

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
