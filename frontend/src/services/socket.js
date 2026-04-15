import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Singleton socket instance
export const socket = io(URL, {
  autoConnect: false,
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true",
    "ngrok-skip-browser-warning": "true"
  },
  auth: (cb) => {
    // CRITICAL FIX: usar a chave correta 'wise_token' (mesma do api.js interceptor)
    const token = localStorage.getItem('wise_token');
    cb({ token });
  }
});

/**
 * Conecta o socket se houver um token
 */
export const connectSocket = () => {
  // CRITICAL FIX: usar a chave correta 'wise_token' (mesma do api.js interceptor)
  const token = localStorage.getItem('wise_token');
  if (token && !socket.connected) {
    socket.connect();
  }
};

/**
 * Desconecta o socket (limpeza)
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

/**
 * Entrar em uma conversa específica para receber mensagens em tempo real naquela sala
 */
export const viewChat = (chatId) => {
  if (socket.connected) {
    socket.emit('view_chat', chatId);
  }
};

/**
 * Sair de uma conversa específica
 */
export const leaveChat = (chatId) => {
  if (socket.connected) {
    socket.emit('leave_chat', chatId);
  }
};
