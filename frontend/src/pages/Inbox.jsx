import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  MessageSquare, Loader2, Sparkles, Send,
  Thermometer, Tag, Search, TrendingUp,
  BrainCircuit, Zap, ChevronRight, Mic,
  Paperclip, FileText, Square, Trash2,
  CheckCircle2, X, Image as ImageIcon, Wifi, WifiOff,
  RefreshCcw, PlusMessageSquare, Users
} from 'lucide-react';
import { leadsApi, messagesApi, uploadApi } from '../services/api';
import { socket, connectSocket, disconnectSocket, viewChat, leaveChat } from '../services/socket';
import api from '../services/api';

// ── Conversation Item ──────────────────────────────────────────────────────
function ConversationItem({ conv, active, onClick }) {
  const lastMsg = conv.lastMessage || 'Nenhuma mensagem';
  const lead = conv.lead || {};

  const getTempColor = (temp) => {
    if (temp >= 70) return '#EF4444';
    if (temp >= 30) return '#F59E0B';
    return '#3B82F6';
  };

  return (
    <button onClick={onClick} className="w-full text-left px-4 py-3 transition-all relative group"
      style={{
        background: active ? 'rgba(250,212,133,0.06)' : 'transparent',
        borderLeft: active ? '2px solid #FAD485' : '2px solid transparent',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 uppercase relative"
          style={{ background: 'rgba(250,212,133,0.08)', color: '#FAD485' }}>
          {lead.name ? lead.name.charAt(0) : '?'}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black"
            style={{ background: getTempColor(lead.temperature || 0) }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white truncate">{lead.name}</p>
            <p className="text-[10px] shrink-0 ml-2" style={{ color: '#4A4840' }}>
              {new Date(conv.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[11px] truncate flex-1 pr-4" style={{ color: '#6B6860' }}>{lastMsg}</p>
            {conv.unreadCount > 0 && (
              <span className="bg-[#FAD485] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                {conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── New Chat Modal ─────────────────────────────────────────────────────────
function NewChatModal({ onClose, onSelect }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data } = await leadsApi.getAll();
        setLeads(data);
      } catch (err) {
        console.error('Erro ao buscar leads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const filtered = leads.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0A0A07] border border-[#FAD485]/20 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-slide-up">
        <div className="p-4 border-b border-[#FAD485]/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FAD485]" />
            <h3 className="text-white font-black uppercase tracking-wider text-sm">Nova Conversa</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-[#6B6860] transition-colors text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 bg-black/30 border border-white/10 px-3 py-2 rounded-xl">
            <Search className="w-4 h-4 text-[#6B6860]" />
            <input 
              type="text" 
              placeholder="Pesquisar contatos..." 
              className="bg-transparent border-none outline-none text-sm text-white flex-1"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-premium">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#FAD485] animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-[#6B6860] text-sm">Nenhum contato encontrado.</p>
          ) : (
            filtered.map(lead => (
              <button key={lead.id} onClick={() => onSelect(lead)} className="w-full text-left p-3 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors border-b border-white/5 last:border-0 group">
                <div className="w-10 h-10 rounded-full bg-[#FAD485]/10 flex items-center justify-center text-[#FAD485] font-black uppercase shrink-0">
                  {lead.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-[#FAD485] transition-colors">{lead.name}</p>
                  <p className="text-xs text-[#6B6860] truncate">{lead.phone || lead.whatsappJid || 'Sem número'}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-white/5 text-[#6B6860] rounded-lg group-hover:bg-[#FAD485]/10 group-hover:text-[#FAD485] transition-colors">
                  {lead.pipeline?.name || lead.status}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Template Selector ──────────────────────────────────────────────────────
function TemplateSelector({ templates, onSelect, onClose, loading }) {
  return (
    <div className="animate-slide-up p-4 rounded-2xl space-y-2 mb-2"
      style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.12)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#FAD485]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FAD485]">Templates Inteligentes</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-[#6B6860]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(250,212,133,0.04)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t.label}
              onClick={() => { onSelect(t.text); onClose(); }}
              className="text-left p-3 rounded-xl text-[11px] transition-all group"
              style={{ background: 'rgba(250,212,133,0.04)', border: '1px solid rgba(250,212,133,0.10)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(250,212,133,0.25)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(250,212,133,0.10)'}
            >
              <p className="font-bold text-[#FAD485]">{t.label}</p>
              <p className="text-[#6B6860] mt-0.5 leading-relaxed line-clamp-2">{t.text}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Image Preview Before Send ─────────────────────────────────────────────
function ImagePreview({ file, previewUrl, onSend, onCancel, sending }) {
  return (
    <div className="animate-slide-up p-4 rounded-2xl mb-2"
      style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.15)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-[#FAD485]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FAD485]">Imagem Selecionada</p>
        </div>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-red-500/10 text-[#6B6860] hover:text-red-400 transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden mb-3 max-h-48 bg-black/20 flex items-center justify-center">
        <img src={previewUrl} alt="Preview" className="max-h-48 object-contain rounded-xl" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#6B6860] truncate flex-1 pr-2">{file?.name}</p>
        <div className="flex gap-2 shrink-0">
          <button onClick={onCancel}
            className="px-3 py-1.5 text-[10px] font-bold rounded-xl border border-white/10 text-[#6B6860] hover:text-white transition-all">
            Cancelar
          </button>
          <button onClick={onSend} disabled={sending}
            className="px-4 py-1.5 text-[10px] font-black rounded-xl bg-[#FAD485] text-black hover:bg-[#F5C842] transition-all flex items-center gap-1.5 disabled:opacity-60">
            {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {sending ? 'Enviando...' : 'Enviar Imagem'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── File Upload Button ─────────────────────────────────────────────────────
function FileUploadButton({ onImageSelected, onDocumentSend, disabled }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Imagens: mostrar preview primeiro (não fazer upload ainda)
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      onImageSelected(file, previewUrl);
      e.target.value = '';
      return;
    }

    // Documentos: upload direto sem preview
    setUploading(true);
    try {
      const { data } = await uploadApi.uploadFile(file);
      await onDocumentSend(data.url, 'document', data.filename || file.name);
    } catch (err) {
      alert('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleChange}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2 rounded-lg transition-all disabled:opacity-40"
        style={{ color: uploading ? '#FAD485' : '#6B6860' }}
        title="Anexar arquivo"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4 hover:text-[#FAD485]" />}
      </button>
    </>
  );
}

// ── Audio Recorder (auto-start) ────────────────────────────────────────────
function AudioRecorderActive({ onSend, onCancel, disabled }) {
  const [phase, setPhase] = useState('recording'); // recording | preview
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Auto-start na montagem do componente
  useEffect(() => {
    startRecording();
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setPhase('preview');
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (err) {
      alert('Permissão de microfone negada ou dispositivo não disponível.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && phase === 'recording') {
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    onCancel();
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    setUploading(true);
    try {
      const ext = audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
      const file = new File([audioBlob], `audio-${Date.now()}.${ext}`, { type: audioBlob.type });
      const { data } = await uploadApi.uploadFile(file);
      await onSend('', { url: data.url, type: 'audio', filename: data.filename });
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    } catch (err) {
      alert('Erro ao enviar áudio. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  if (phase === 'recording') {
    return (
      <div className="flex items-center gap-3 flex-1 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className="text-sm font-black text-red-400 w-10 shrink-0">{formatTime(recordingTime)}</span>
        <p className="text-[10px] text-red-400/60 uppercase font-bold flex-1">Gravando...</p>
        <button onClick={cancelRecording} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all" title="Cancelar">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={stopRecording} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-black hover:bg-red-600 transition-all flex items-center gap-1.5">
          <Square className="w-3 h-3" /> Parar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-1 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(250,212,133,0.05)', border: '1px solid rgba(250,212,133,0.15)' }}>
      <Mic className="w-3.5 h-3.5 text-[#FAD485] shrink-0" />
      <audio controls src={audioUrl} className="flex-1 h-7" style={{ minWidth: 0 }} />
      <button onClick={cancelRecording} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#6B6860] hover:text-red-400 transition-all shrink-0" title="Descartar">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={sendAudio} disabled={uploading}
        className="px-3 py-1.5 rounded-lg bg-[#FAD485] text-black text-[10px] font-black hover:bg-[#F5C842] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60">
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        {uploading ? 'Enviando...' : 'Enviar'}
      </button>
    </div>
  );
}

// ── Default templates fallback ──────────────────────────────────────────────
const DEFAULT_TEMPLATES = [
  { label: '👋 Boas-vindas', text: 'Olá! Obrigado por entrar em contato. Como posso te ajudar hoje?' },
  { label: '📅 Agendar', text: 'Ótimo! Vamos agendar uma conversa. Qual o melhor horário para você?' },
  { label: '📋 Proposta', text: 'Preparei uma proposta personalizada para você. Posso te enviar agora?' },
  { label: '🔥 Urgência', text: 'Esta oferta é por tempo limitado! Posso te ajudar a fechar agora?' },
  { label: '✅ Confirmação', text: 'Perfeito! Tudo confirmado. Em breve entrarei em contato com mais detalhes.' },
  { label: '📞 Contato', text: 'Posso te ligar agora para falarmos melhor?' },
];

// ── Main Inbox ─────────────────────────────────────────────────────────────
export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const [status, setStatus] = useState('DISCONNECTED');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Image preview state
  const [pendingImage, setPendingImage] = useState(null); // { file, previewUrl }
  const [uploadingImage, setUploadingImage] = useState(false);

  // AI templates
  const [smartTemplates, setSmartTemplates] = useState(DEFAULT_TEMPLATES);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // IA Decision State
  const [aiDecision, setAiDecision] = useState(null);
  const [processingAI, setProcessingAI] = useState(false);

  // Fetch smart templates when active conversation changes
  const fetchSmartTemplates = useCallback(async (leadId) => {
    if (!leadId) return;
    setLoadingTemplates(true);
    try {
      const { data } = await api.get(`/leads/${leadId}/smart-templates`);
      if (data && data.length > 0) setSmartTemplates(data);
      else setSmartTemplates(DEFAULT_TEMPLATES);
    } catch {
      setSmartTemplates(DEFAULT_TEMPLATES);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    connectSocket();

    socket.on('message:new', (payload) => {
      if (payload.conversationId) {
        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === payload.conversationId);
          if (idx !== -1) {
            const newConvs = [...prev];
            newConvs[idx] = {
              ...newConvs[idx],
              lastMessage: payload.message?.content || 'Nova mensagem',
              updatedAt: new Date().toISOString(),
              unreadCount: activeConv?.id === payload.conversationId ? 0 : (newConvs[idx].unreadCount + 1)
            };
            return newConvs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          }
          return prev;
        });

        if (activeConv?.id === payload.conversationId) {
          setMessages(prev => [...prev, payload.message]);
          scrollToBottom();
          setProcessingAI(true);
        }
      } else {
        setMessages(prev => [...prev, payload]);
        scrollToBottom();
      }
    });

    socket.on('ai:decision', (payload) => {
      if (activeConv?.id === payload.conversationId) {
        setAiDecision(payload);
        setProcessingAI(false);
        setActiveConv(prev => prev ? {
          ...prev,
          lead: {
            ...prev.lead,
            temperature: payload.analysis?.temperatura === 'quente' ? 100 : payload.analysis?.temperatura === 'morno' ? 50 : 20,
            probability: payload.analysis?.probabilidade,
            summary: payload.analysis?.resumo
          }
        } : null);
        // Refresh templates with new context
        if (activeConv?.leadId) fetchSmartTemplates(activeConv.leadId);
      }
    });

    socket.on('whatsapp_status', (data) => setStatus(data.status));

    return () => {
      socket.off('message:new');
      socket.off('ai:decision');
      socket.off('whatsapp_status');
    };
  }, [activeConv?.id]);

  useEffect(() => {
    if (activeConv) viewChat(activeConv.id);
    return () => { if (activeConv) leaveChat(activeConv.id); };
  }, [activeConv?.id]);

  const fetchConversations = async () => {
    try {
      const { data } = await leadsApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Erro ao buscar conversas', err);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = (lead) => {
    setShowNewChatModal(false);
    // Verificar se já existe na lista atual
    const existingConv = conversations.find(c => c.leadId === lead.id);
    if (existingConv) {
      setActiveConv(existingConv);
    } else {
      // Criar conversa simulada até a primeira mensagem
      const simulatedConv = {
        id: `virtual_${lead.id}`,
        jid: lead.phone || lead.whatsappJid || '',
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
        leadId: lead.id,
        lead: lead,
        lastMessage: 'Nova conversa iniciada'
      };
      setConversations(prev => [simulatedConv, ...prev]);
      setActiveConv(simulatedConv);
    }
  };

  useEffect(() => {
    if (!activeConv) return;
    const fetchHistory = async () => {
      try {
        const { data } = await messagesApi.getByLead(activeConv.leadId);
        setMessages(data);
        scrollToBottom();
        setAiDecision(null);
        setPendingImage(null);
      } catch (err) {
        console.error('Erro ao buscar histórico', err);
      }
    };
    fetchHistory();
    fetchSmartTemplates(activeConv.leadId);
    setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, unreadCount: 0 } : c));
  }, [activeConv?.id]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSendMessage = async (textOverride = null, mediaData = null) => {
    const content = textOverride ?? msgInput.trim();
    if (!content && !mediaData) return;
    if (!activeConv) return;

    if (!textOverride && !mediaData) setMsgInput('');
    setSending(true);
    try {
      const payload = mediaData
        ? { content: mediaData.url || '', type: mediaData.type, mediaUrl: mediaData.url, filename: mediaData.filename }
        : { content };

      const tempMsg = {
        id: `temp_${Date.now()}`,
        content: payload.content || '[Mídia]',
        sender: 'user',
        type: mediaData?.type || 'text',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);
      scrollToBottom();

      await messagesApi.send(activeConv.leadId, payload.content, {
        jid: activeConv.jid,
        type: payload.type,
        mediaUrl: payload.mediaUrl,
        filename: payload.filename
      });

      // Remove temp message as the socket will deliver the confirmed DB message
      setMessages(prev => prev.filter(m => !m.id?.toString().startsWith('temp_')));
      setAiDecision(null);
    } catch (err) {
      console.error('Erro ao enviar mensagem', err);
      setMessages(prev => prev.filter(m => !m.id?.toString().startsWith('temp_')));
    } finally {
      setSending(false);
    }
  };

  // Handle image selected — show preview
  const handleImageSelected = (file, previewUrl) => {
    setPendingImage({ file, previewUrl });
  };

  // Confirm send image
  const handleConfirmSendImage = async () => {
    if (!pendingImage) return;
    setUploadingImage(true);
    try {
      const { data } = await uploadApi.uploadFile(pendingImage.file);
      await handleSendMessage('', { url: data.url, type: 'image', filename: data.filename || pendingImage.file.name });
      URL.revokeObjectURL(pendingImage.previewUrl);
      setPendingImage(null);
    } catch (err) {
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancelPendingImage = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  const handleDocumentSend = async (url, type, filename) => {
    await handleSendMessage('', { url, type, filename });
  };

  const filteredConversations = conversations.filter(c =>
    (c.lead?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.jid || '').includes(searchTerm)
  );

  const renderMessage = (msg) => {
    const isUser = msg.sender === 'user';
    return (
      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] px-4 py-2.5 rounded-2xl relative"
          style={isUser
            ? { background: 'linear-gradient(135deg,#FAD485,#F5C842)', color: '#000', borderBottomRightRadius: '4px' }
            : { background: '#0A0A07', color: '#E8E6DF', border: '1px solid rgba(250,212,133,0.08)', borderBottomLeftRadius: '4px' }
          }>

          {msg.type === 'image' && (
            <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
              <img src={msg.content} alt="Imagem" className="max-w-full h-auto cursor-pointer rounded-lg max-h-64 object-cover"
                onClick={() => window.open(msg.content)} />
            </div>
          )}

          {msg.type === 'audio' && (
            <div className="flex items-center gap-3 py-1 min-w-[200px]">
              <Mic className="w-4 h-4 shrink-0 opacity-60" />
              <audio controls className="flex-1 h-8" src={msg.content}
                style={{ filter: isUser ? 'invert(1) brightness(0)' : 'none' }} />
            </div>
          )}

          {msg.type === 'document' && (
            <a href={msg.content} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-black/5 hover:bg-black/10 transition-all border border-black/5 mb-1">
              <FileText className="w-5 h-5 opacity-50" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Documento</p>
                <p className="text-xs font-bold truncate">{msg.filename || 'Abrir Arquivo'}</p>
              </div>
            </a>
          )}

          {(!msg.type || msg.type === 'text') && (
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          )}

          <p className="text-[9px] mt-1 text-right opacity-40 uppercase">
            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-black h-[calc(100vh-88px)] rounded-2xl overflow-hidden animate-fade-in"
      style={{ border: '1px solid rgba(250,212,133,0.08)' }}>

      {/* Sidebar */}
      <div className="w-80 shrink-0 flex flex-col" style={{ background: '#060604', borderRight: '1px solid rgba(250,212,133,0.06)' }}>
        <div className="px-5 py-4 space-y-4" style={{ borderBottom: '1px solid rgba(250,212,133,0.06)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Inbox</h2>
            <div className="flex items-center gap-1.5">
              {status === 'CONNECTED'
                ? <Wifi className="w-3.5 h-3.5 text-green-400" />
                : <WifiOff className="w-3.5 h-3.5 text-red-400" />
              }
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
            </div>
          </div>

          <button onClick={() => setShowNewChatModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FAD485]/10 text-[#FAD485] hover:bg-[#FAD485]/20 border border-[#FAD485]/20 transition-all group">
            <PlusMessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider">Nova Conversa</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(250,212,133,0.03)', border: '1px solid rgba(250,212,133,0.08)' }}>
            <Search className="w-3.5 h-3.5" style={{ color: '#4A4840' }} />
            <input
              type="text"
              placeholder="Buscar conversa..."
              className="bg-transparent border-none text-[11px] outline-none text-white w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-premium">
          {loading ? (
            <div className="flex justify-center p-8"><div className="wise-spinner" /></div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-xs opacity-50 text-[#6B6860]">Nenhuma conversa ativa</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={activeConv?.id === conv.id}
                onClick={() => setActiveConv(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col" style={{ background: '#000000' }}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="px-5 py-4 flex items-center justify-between shrink-0"
              style={{ borderBottom: '1px solid rgba(250,212,133,0.06)', background: 'rgba(6,6,4,0.9)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm uppercase"
                  style={{ background: 'rgba(250,212,133,0.08)', color: '#FAD485' }}>
                  {activeConv.lead.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{activeConv.lead.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: '#6B6860' }}>
                      {activeConv.jid?.split('@')[0]}
                    </span>
                    {activeConv.lead.summary && (
                      <span className="text-[10px] uppercase font-bold text-[#FAD485] truncate max-w-[160px]">
                        {activeConv.lead.summary}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-[#6B6860] uppercase">Temperatura</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Thermometer className="w-3 h-3 text-[#FAD485]" />
                    <span className="text-xs font-black text-white">{activeConv.lead.temperature || 0}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-[#6B6860] uppercase">Probabilidade</p>
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-black text-white">{activeConv.lead.probability || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-premium">
              {messages.map(msg => renderMessage(msg))}
              {processingAI && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                    <BrainCircuit className="w-3 h-3 text-[#FAD485] animate-spin" />
                    <span className="text-[10px] text-[#6B6860]">Alanis analisando conversa...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-5 pb-5 shrink-0 space-y-3">

              {/* Image Preview Panel */}
              {pendingImage && (
                <ImagePreview
                  file={pendingImage.file}
                  previewUrl={pendingImage.previewUrl}
                  onSend={handleConfirmSendImage}
                  onCancel={handleCancelPendingImage}
                  sending={uploadingImage}
                />
              )}

              {/* Templates Panel */}
              {showTemplates && !pendingImage && (
                <TemplateSelector
                  templates={smartTemplates}
                  loading={loadingTemplates}
                  onSelect={(text) => setMsgInput(text)}
                  onClose={() => setShowTemplates(false)}
                />
              )}

              {/* AI Decision Panel */}
              {aiDecision && !pendingImage && (
                <div className="p-4 rounded-2xl border border-[#FAD485]/20 animate-slide-up space-y-3"
                  style={{ background: 'rgba(250,212,133,0.03)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#FAD485]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FAD485]">Alanis — SDR IA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                        <Zap className="w-2.5 h-2.5 text-green-400" />
                        <span className="text-[9px] font-bold text-green-400 uppercase">{aiDecision.strategy?.proxima_acao}</span>
                      </div>
                      <button onClick={() => setAiDecision(null)} className="p-1 rounded-lg hover:bg-white/5 text-[#6B6860]">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white leading-relaxed italic">"{aiDecision.suggestedResponse}"</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <p className="text-[10px] text-white/40">{aiDecision.strategy?.objetivo}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setMsgInput(aiDecision.suggestedResponse)}
                        className="px-3 py-1.5 rounded-lg border border-[#FAD485]/20 text-[#FAD485] text-[10px] font-bold hover:bg-[#FAD485]/05 transition-all">
                        Editar
                      </button>
                      <button onClick={() => handleSendMessage(aiDecision.suggestedResponse)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAD485] text-black hover:bg-[#F5C842] transition-all font-bold text-[10px] uppercase">
                        Aprovar e Enviar <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Box */}
              {!pendingImage && (
                <div className="flex gap-2 items-center p-2 rounded-2xl relative"
                  style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.10)' }}>

                  {/* Left tools */}
                  <div className="flex items-center gap-1 pl-1">
                    <FileUploadButton
                      onImageSelected={handleImageSelected}
                      onDocumentSend={handleDocumentSend}
                      disabled={sending || showAudioRecorder}
                    />
                    <button
                      onClick={() => { setShowTemplates(!showTemplates); }}
                      className="p-2 rounded-lg transition-all"
                      style={{ color: showTemplates ? '#FAD485' : '#6B6860' }}
                      title="Templates inteligentes"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Audio recorder (auto-start) or text input */}
                  {showAudioRecorder ? (
                    <AudioRecorderActive
                      onSend={handleSendMessage}
                      onCancel={() => setShowAudioRecorder(false)}
                      disabled={sending}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Digite sua mensagem..."
                      className="flex-1 bg-transparent border-none text-sm outline-none px-2 text-[#E8E6DF] placeholder:text-[#4A4840]"
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={sending}
                    />
                  )}

                  {/* Right tools */}
                  <div className="flex items-center gap-1 pr-1">
                    {!showAudioRecorder && msgInput.trim() === '' && (
                      <button
                        onClick={() => setShowAudioRecorder(true)}
                        disabled={sending}
                        className="p-2.5 rounded-xl transition-all text-[#FAD485] hover:bg-[#FAD485]/10 disabled:opacity-40"
                        title="Gravar áudio"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                    {!showAudioRecorder && (
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={sending || !msgInput.trim()}
                        className="btn-primary px-4 py-2 text-xs rounded-xl flex items-center justify-center disabled:opacity-40"
                      >
                        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center opacity-30">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              <p className="text-sm font-medium text-white">Selecione uma conversa</p>
              <p className="text-xs mt-1" style={{ color: '#6B6860' }}>para iniciar o atendimento com Alanis IA</p>
            </div>
          </div>
        )}
      </div>

      {showNewChatModal && (
        <NewChatModal 
          onClose={() => setShowNewChatModal(false)} 
          onSelect={startNewChat} 
        />
      )}
    </div>
  );
}
