import React, { useState } from 'react';
import { useChatStore } from '../../store/useChatStore';

export default function ChatWindow() {
  const { messages, activeLeadId } = useChatStore();
  const [text, setText] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await fetch('/api/v1/inbox/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ leadId: activeLeadId, content: text })
      });
      setText('');
    } catch (err) {
      console.error('Falha ao enviar mensagem', err);
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-950">
      {/* Header do Chat */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
            LD
          </div>
          <div>
            <h2 className="text-slate-100 font-semibold tracking-wide">Lead Ativo</h2>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isMe = msg.sender === 'SDR';
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[70%] p-4 text-sm leading-relaxed shadow-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-indigo-900/20' 
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleSend} className="flex gap-3">
          <input 
            type="text" 
            className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-slate-500"
            placeholder="Digite sua resposta..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button type="submit" className="bg-indigo-600 text-white rounded-xl px-8 font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 active:scale-95">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
