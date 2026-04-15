const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function(origin, callback) {
        callback(null, origin || true);
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  // 1. Middleware de Autenticação JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      console.log('[Socket Auth] Conexão recusada: Token não fornecido.');
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      // Se houvesse companyId no token, adicionaríamos aqui
      // socket.companyId = decoded.companyId; 
      next();
    } catch (err) {
      console.log('[Socket Auth] Conexão recusada: Token inválido.', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id} (Usuário: ${socket.userId})`);

    // 2. Auto-join nas salas segmentadas
    socket.join(`user:${socket.userId}`);
    // Exemplo de sala de empresa (futuro): socket.join(`company:${socket.companyId}`);

    // Sala de chat ativa (o frontend emite 'view_chat' quando entra num chat específico)
    socket.on('view_chat', (chatId) => {
      // Limpar outras salas de chat se necessário, ou apenas join
      socket.join(`chat:${chatId}`);
      console.log(`[Socket] Usuário ${socket.userId} visualizando chat: ${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io não inicializado!');
  }
  return io;
};

module.exports = { initSocket, getIO };
