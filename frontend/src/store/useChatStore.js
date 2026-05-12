import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  activeLeadId: null,
  messages: [],
  alanisRationale: null, // Insight atual da IA
  isLoading: false,

  setActiveLead: (leadId) => set({ activeLeadId: leadId }),
  setMessages: (messages) => set({ messages }),
  
  // Adiciona nova mensagem chegando via Socket.io
  addMessage: (message) => {
    const { activeLeadId, messages } = get();
    if (message.leadId === activeLeadId) {
      set({ messages: [...messages, message] });
    }
  },

  // Quando o Worker processa a IA e envia via Socket
  setAlanisRationale: (rationale) => set({ alanisRationale: rationale })
}));
