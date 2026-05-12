import React, { useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import ChatWindow from './ChatWindow';
import AlanisSidebar from './AlanisSidebar';
import { io } from 'socket.io-client';

export default function SmartInbox() {
  const { activeLeadId, addMessage, setAlanisRationale } = useChatStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3001', { auth: { token } });

    // Escutando novas mensagens em tempo real (SDR ou Lead)
    socket.on('message_new', (payload) => {
      addMessage(payload);
    });

    // Escutando insights processados pelo BullMQ da Alanis V3
    socket.on('alanis_insight', (payload) => {
      if (payload.leadId === activeLeadId) {
        setAlanisRationale(payload.rationale);
      }
    });

    return () => socket.disconnect();
  }, [activeLeadId, addMessage, setAlanisRationale]);

  return (
    <div className="flex h-screen bg-white">
      {/* Lista de Chats (Esquerda) - Omitido por brevidade */}
      <div className="w-1/4 border-r border-gray-200 p-4">
        <h2 className="text-xl font-bold mb-4">Conversas</h2>
        <p className="text-sm text-gray-500">Selecione um lead...</p>
      </div>

      {/* Área Central de Chat (WhatsApp Style) */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {activeLeadId ? <ChatWindow /> : <div className="m-auto text-gray-400">Nenhum chat selecionado.</div>}
      </div>

      {/* Painel Estratégico da Alanis V3 (Direita) */}
      <div className="w-1/3 border-l border-gray-200 bg-white">
        <AlanisSidebar />
      </div>
    </div>
  );
}
