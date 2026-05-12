const { Server } = require('socket.io');
const jwt = require('jsonwebtoken'); // Para decodificar o token

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Adaptar para o front de prod no deploy
      methods: ['GET', 'POST']
    }
  });

  // Middleware de Handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    if (!token) {
      return next(new Error('Acesso negado: Token não fornecido.'));
    }

    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
      
      // Injetar dados do usuário no socket para uso futuro
      socket.user = decoded; 
      // ECC Constraint: Socket só escuta e fala com a sua PRÓPRIA agência.
      socket.companyId = decoded.companyId;

      next();
    } catch (err) {
      return next(new Error('Acesso negado: Token inválido.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Usuário conectado: ${socket.user.id}`);

    // ECC Multitenancy: Travar este socket dentro de uma "Room" específica da agência.
    // Todas as emissões server-side (ex: io.to('company_xxx').emit(...)) 
    // garantirão que dados não vazem pra concorrentes.
    const companyRoom = `company_${socket.companyId}`;
    socket.join(companyRoom);
    console.log(`[WebSocket] Socket acoplado à sala: ${companyRoom}`);

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Usuário desconectado: ${socket.user.id}`);
    });
  });

  return io;
};

// Funções Helpers para Controllers / Workers enviarem mensagens
const emitToCompany = (companyId, event, payload) => {
  if (io) {
    io.to(`company_${companyId}`).emit(event, payload);
  }
};

module.exports = {
  initSocket,
  emitToCompany
};
