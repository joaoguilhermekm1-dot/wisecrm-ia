import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Target, MousePointer2, 
  MessageCircle, DollarSign, Activity, ChevronRight, 
  RefreshCcw, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight, 
  Sparkles, X, QrCode, Loader2, CheckCircle2, Settings2,
  Wifi, WifiOff, RotateCcw, Link2, Link2Off, Send, BrainCircuit
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { marketingApi, whatsappApi } from '../services/api';
import { socket, connectSocket } from '../services/socket';

// ── WhatsApp Modal ──────────────────────────────────────────────────────
function WhatsAppModal({ onClose }) {
  const [status, setStatus] = useState('LOADING');
  const [qr, setQr] = useState(null);
  const [resetting, setResetting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await whatsappApi.getStatus();
      setStatus(data.status);
      setQr(data.qr || null);

      // Se ainda não tiver QR e estiver desconectado, iniciar
      if (data.status === 'DISCONNECTED' && !data.qr) {
        await whatsappApi.start();
      }
    } catch (e) {
      setStatus('ERROR');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Ouvir atualizações em tempo real via socket
  useEffect(() => {
    connectSocket();
    const handler = (data) => {
      setStatus(data.status);
      if (data.qr) setQr(data.qr);
      if (data.status === 'CONNECTED') setQr(null);
    };
    socket.on('whatsapp_status', handler);
    return () => socket.off('whatsapp_status', handler);
  }, []);

  const handleReset = async () => {
    setResetting(true);
    setQr(null);
    setStatus('LOADING');
    try {
      await whatsappApi.reset();
    } catch (e) {}
    setResetting(false);
  };

  const statusConfig = {
    CONNECTED:    { label: 'Conectado',     color: '#22C55E', icon: Wifi },
    DISCONNECTED: { label: 'Desconectado',  color: '#EF4444', icon: WifiOff },
    CONNECTING:   { label: 'Conectando...', color: '#F59E0B', icon: Loader2 },
    LOADING:      { label: 'Carregando...', color: '#6B6860', icon: Loader2 },
    ERROR:        { label: 'Erro',          color: '#EF4444', icon: AlertCircle },
  };

  const cfg = statusConfig[status] || statusConfig.DISCONNECTED;
  const StatusIcon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden animate-fade-in"
        style={{ background: '#0A0A07', border: '1px solid rgba(37,211,102,0.2)', boxShadow: '0 40px 100px rgba(0,0,0,0.9)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)' }}>
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">WhatsApp Business</h3>
              <p className="text-[10px] text-[#6B6860] uppercase tracking-widest">Wise Engine · Motor Baileys</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-[#6B6860] hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-4 h-4 ${status === 'LOADING' || status === 'CONNECTING' ? 'animate-spin' : ''}`} style={{ color: cfg.color }} />
              <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            {status === 'CONNECTED' && (
              <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
            )}
          </div>
        </div>

        {/* QR Code Area */}
        <div className="p-6">
          {status === 'CONNECTED' ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
                <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
              </div>
              <h4 className="text-xl font-black text-white">Sessão Ativa!</h4>
              <p className="text-sm text-[#6B6860]">Seu WhatsApp está conectado ao Wise CRM IA e pronto para automações.</p>
            </div>
          ) : qr ? (
            <div className="text-center space-y-4">
              <p className="text-[11px] text-[#6B6860] uppercase tracking-widest font-bold">Escaneie o QR Code com seu celular</p>
              <div className="p-4 rounded-2xl bg-white inline-block">
                <img src={qr} alt="QR Code WhatsApp" className="w-52 h-52" />
              </div>
              <p className="text-[10px] text-[#4A4840]">Abra WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho</p>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(250,212,133,0.05)'}}>
                <QrCode className="w-8 h-8 text-[#4A4840]" />
              </div>
              <p className="text-sm text-[#6B6860]">Gerando QR Code seguro...</p>
              <div className="wise-spinner mx-auto" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#6B6860] hover:text-white border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Reiniciando...' : 'Hard Reset'}
          </button>
          <button onClick={onClose} className="btn-primary flex-1 py-3 text-xs rounded-2xl">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────────
function MetricCard({ title, value, change, icon: Icon, suffix = "", prefix = "" }) {
  const isPositive = parseFloat(change) >= 0;
  return (
    <div className="p-5 rounded-3xl space-y-3 border border-white/5 hover:border-white/10 transition-all"
      style={{ background: '#0A0A07' }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 text-[#FAD485]">
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6860]">{title}</p>
        <h3 className="text-2xl font-black text-white mt-1">{prefix}{value}{suffix}</h3>
      </div>
    </div>
  );
}

// ── Integration Card ─────────────────────────────────────────────────────
function IntegrationCard({ name, description, colorClass, textColor, icon: Icon, status, onConnect, connectLabel, connecting }) {
  const isConnected = status === 'CONNECTED';
  return (
    <div className="p-8 rounded-[2.5rem] border border-white/5 space-y-6 flex flex-col justify-between hover:border-white/10 transition-all"
      style={{ background: '#0A0A07' }}>
      <div className="space-y-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass}`}>
          <Icon className={`w-7 h-7 ${textColor}`} />
        </div>
        <div>
          <h3 className="text-xl font-black text-white">{name}</h3>
          <p className="text-xs text-[#6B6860] leading-relaxed mt-1">{description}</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#6B6860]">
          <span>Status</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
        <button
          onClick={onConnect}
          disabled={connecting}
          className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
            isConnected
              ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              : `bg-white/5 border border-white/10 text-white hover:bg-white/10`
          }`}
        >
          {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isConnected ? <Link2 className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
          {connecting ? 'Redirecionando...' : connectLabel}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function MarketingHub() {
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [connectingMeta, setConnectingMeta] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [waRealStatus, setWaRealStatus] = useState('LOADING'); // Status real do Baileys
  const [showGoogleWarning, setShowGoogleWarning] = useState(false);

  // Novos States para Filtros e Agente
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [processingChat, setProcessingChat] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Ler params de URL (callback do OAuth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_connected') === 'true') {
      showToast('✅ Meta Ads conectado com sucesso!', 'success');
      window.history.replaceState({}, '', '/marketing');
    }
    if (params.get('google_connected') === 'true') {
      showToast('✅ Google Ads conectado com sucesso!', 'success');
      window.history.replaceState({}, '', '/marketing');
    }
    if (params.get('error')) {
      showToast(`❌ Erro na conexão: ${params.get('error')}`, 'error');
      window.history.replaceState({}, '', '/marketing');
    }
  }, []);

  const fetchIntegrations = useCallback(async () => {
    try {
      const { data } = await marketingApi.getIntegrations();
      setIntegrations(data);
    } catch (e) {}
  }, []);

  // Buscar status REAL do WhatsApp (Baileys em memória, não tabela Integration)
  const fetchWaStatus = useCallback(async () => {
    try {
      const { data } = await whatsappApi.getStatus();
      setWaRealStatus(data.status || 'DISCONNECTED');
    } catch {
      setWaRealStatus('DISCONNECTED');
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const { data } = await marketingApi.getAdAccounts();
      setAdAccounts(data);
      if (data.length > 0) setSelectedAccountId(data[0].id);
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchIntegrations();
    fetchWaStatus();
    fetchAccounts();
  }, [fetchIntegrations, fetchWaStatus, fetchAccounts]);

  // Re-check WA status quando a aba de conexões é aberta
  useEffect(() => {
    if (activeTab === 'integrations') fetchWaStatus();
  }, [activeTab, fetchWaStatus]);

  useEffect(() => {
    if (selectedAccountId) fetchInsights();
  }, [selectedAccountId, startDate, endDate]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data } = await marketingApi.getAdInsights(selectedAccountId, startDate, endDate);
      setInsights(data);
    } catch (err) {
      console.error('Erro ao buscar métricas', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedAccountId) return;
    setSyncing(true);
    try {
      const res = await marketingApi.syncAdInsights(selectedAccountId);
      showToast(res.data?.message || 'Métricas sincronizadas!', 'success');
      await fetchInsights();
    } catch (err) {
      showToast(err.response?.data?.error || 'Falha ao sincronizar. Verifique a conexão com a Meta.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectMeta = async () => {
    setConnectingMeta(true);
    try {
      const { data } = await marketingApi.getMetaConnectUrl();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      showToast('Erro ao iniciar conexão com a Meta.', 'error');
    } finally {
      setConnectingMeta(false);
    }
  };

  const handleConnectGoogle = async () => {
    setShowGoogleWarning(true); // Mostrar aviso antes de redirecionar
  };

  const confirmConnectGoogle = async () => {
    setShowGoogleWarning(false);
    setConnectingGoogle(true);
    try {
      const { data } = await marketingApi.getGoogleConnectUrl();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      showToast('Erro ao iniciar conexão com o Google.', 'error');
    } finally {
      setConnectingGoogle(false);
    }
  };

  const getIntegrationStatus = (type) => {
    const found = integrations.find(i => i.type === type);
    return found?.status || 'DISCONNECTED';
  };

  // WhatsApp usa status real do Baileys, não a tabela Integration
  const waStatus = waRealStatus;

  const metrics = insights?.primaryMetrics || {};
  const history = insights?.history || [];
  const topAds = insights?.topAds || [];

  const handleSendChat = async (overrideMsg = null) => {
    const text = overrideMsg || chatInput.trim();
    if (!text) return;
    
    setChatInput('');
    const newChat = [...chatHistory, { sender: 'user', content: text }];
    setChatHistory(newChat);
    setProcessingChat(true);

    try {
      const { data } = await marketingApi.sendAdChat({
        adAccountId: selectedAccountId,
        startDate,
        endDate,
        history: newChat
      });
      
      setChatHistory([
        ...newChat, 
        { sender: 'ia', content: data.mensagem, sugestoes: data.sugestoes }
      ]);
    } catch(e) {
      showToast('Erro ao contatar Agente.', 'error');
    } finally {
      setProcessingChat(false);
    }
  };

  const handleOpenChatFirstTime = async () => {
    setChatOpen(true);
    if (chatHistory.length === 0) {
      setProcessingChat(true);
      try {
        const { data } = await marketingApi.sendAdChat({
          adAccountId: selectedAccountId,
          startDate,
          endDate,
          history: [] // Sem histórico gera mensagem de abertura
        });
        setChatHistory([{ sender: 'ia', content: data.mensagem, sugestoes: data.sugestoes }]);
      } catch(e) { } 
      finally { setProcessingChat(false); }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-24 right-8 z-[100] animate-fade-in px-6 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 max-w-sm ${
          toastType === 'error' 
            ? 'bg-red-950 border-red-500/30 text-red-300' 
            : 'bg-[#0A0A07] border-[#FAD485]/20 text-white'
        }`}>
          {toastType === 'error' 
            ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            : <Sparkles className="w-4 h-4 text-[#FAD485] shrink-0" />
          }
          <p className="text-sm font-bold">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="ml-2 opacity-50 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Google Warning Modal */}
      {showGoogleWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowGoogleWarning(false)}>
          <div className="w-full max-w-sm rounded-2xl animate-fade-in p-6"
            style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.2)', boxShadow: '0 40px 100px rgba(0,0,0,0.9)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)' }}>
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-base font-black text-white mb-2">Aviso do Google OAuth</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9B9589' }}>
                Ao ser redirecionado, o Google irá mostrar uma mensagem{' '}
                <strong className="text-white">"Este app não foi verificado"</strong>.
                Isso é <span className="text-[#FAD485] font-bold">normal em ambiente de desenvolvimento</span>.
              </p>
            </div>
            <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(250,212,133,0.04)', border: '1px solid rgba(250,212,133,0.10)' }}>
              <p className="text-xs font-bold text-[#FAD485] mb-2">Como prosseguir:</p>
              <ol className="text-xs space-y-1" style={{ color: '#9B9589' }}>
                <li>1. Clique em <strong className="text-white">"Avançado"</strong> na tela do Google</li>
                <li>2. Clique em <strong className="text-white">"Acessar [nome do app] (não seguro)"</strong></li>
                <li>3. Autorize as permissões solicitadas</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGoogleWarning(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={confirmConnectGoogle} disabled={connectingGoogle}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {connectingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Entendi, Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Marketing Intelligence</h1>
          <p className="text-[#6B6860] text-sm mt-1">Dashboard de performance em tempo real</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-[#0A0A07] rounded-2xl p-1 border border-white/10 shadow-inner">
          <button 
            onClick={() => setActiveTab('performance')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'performance' ? 'bg-[#FAD485] text-black shadow-lg' : 'text-[#6B6860] hover:text-white'}`}
          >
            <Activity className="w-3.5 h-3.5" /> Performance 
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${activeTab === 'integrations' ? 'bg-[#FAD485] text-black shadow-lg' : 'text-[#6B6860] hover:text-white'}`}
          >
            <Settings2 className="w-3.5 h-3.5" /> Conexões
            {/* Badge de status */}
            {integrations.filter(i => i.status !== 'CONNECTED').length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
            )}
          </button>
        </div>
      </div>

      {/* INTEGRAÇÕES TAB */}
      {activeTab === 'integrations' ? (
        <div className="space-y-6 animate-fade-in">
          <p className="text-xs text-[#6B6860] font-bold uppercase tracking-widest">
            Canais conectados ao Wise CRM IA
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <IntegrationCard
              name="WhatsApp Business"
              description="Conexão direta via Wise Engine para automação de mensagens, leitura de leads e disparo de campanhas."
              colorClass="bg-[#25D366]/10 border border-[#25D366]/20"
              textColor="text-[#25D366]"
              icon={MessageCircle}
              status={waStatus === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED'}
              connectLabel={waStatus === 'CONNECTED' ? 'Sessão Ativa ✔' : 'Gerenciar Sessão'}
              onConnect={() => setShowWhatsAppModal(true)}
            />

            <IntegrationCard
              name="Meta Ads"
              description="Importação automática de métricas de campanhas, conversões e audiências do Facebook e Instagram Ads."
              colorClass="bg-[#1877F2]/10 border border-[#1877F2]/20"
              textColor="text-[#1877F2]"
              icon={Target}
              status={getIntegrationStatus('META')}
              connectLabel={getIntegrationStatus('META') === 'CONNECTED' ? 'Reconectar Meta' : 'Conectar Meta Ads'}
              onConnect={handleConnectMeta}
              connecting={connectingMeta}
            />

            <IntegrationCard
              name="Google Ads"
              description="Análise de ROI e performance de campanhas de busca em tempo real no dashboard Wise Intelligence."
              colorClass="bg-[#EA4335]/10 border border-[#EA4335]/20"
              textColor="text-[#EA4335]"
              icon={Activity}
              status={getIntegrationStatus('GOOGLE')}
              connectLabel={getIntegrationStatus('GOOGLE') === 'CONNECTED' ? 'Reconectar Google' : 'Conectar Google Ads'}
              onConnect={handleConnectGoogle}
              connecting={connectingGoogle}
            />
          </div>

          {/* Info Box */}
          <div className="p-5 rounded-2xl border border-[#FAD485]/10 bg-[#FAD485]/03">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#FAD485] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Como funciona a integração Meta Ads?</p>
                <p className="text-xs text-[#6B6860] mt-1 leading-relaxed">
                  Ao clicar em "Conectar Meta Ads", você será redirecionado para o login da Meta para autorizar o acesso. 
                  Após autorização, você voltará ao Wise CRM com sua conta conectada e pronta para sincronizar métricas reais.
                  <strong className="text-[#FAD485]"> Seu app Meta precisa estar em modo Live para aceitar conexões externas.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

      /* PERFORMANCE TAB */
      ) : loading ? (
        <div className="h-64 flex items-center justify-center"><div className="wise-spinner" /></div>
      ) : !selectedAccountId ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(250,212,133,0.05)', border: '1px solid rgba(250,212,133,0.1)' }}>
            <AlertCircle className="w-8 h-8 text-[#6B6860]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Nenhuma conta conectada</h2>
            <p className="text-[#6B6860] text-sm max-w-xs mt-1">
              Vá em <strong className="text-[#FAD485]">Conexões</strong> e conecte sua conta do Meta Ads para ver métricas reais.
            </p>
          </div>
          <button onClick={() => setActiveTab('integrations')} className="btn-primary text-sm">
            <Settings2 className="w-4 h-4" /> Configurar Conexões
          </button>
        </div>
      ) : (
        <>
          {/* Account Selector + Sync Button + Dates + IA */}
          <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-4 animate-fade-in gap-4">
            <div className="flex items-center gap-3">
              <select 
                value={selectedAccountId || ''} 
                onChange={e => setSelectedAccountId(e.target.value)}
                className="bg-[#0A0A07] border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-[#FAD485]/40 transition-all"
              >
                {adAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="bg-[#0A0A07] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#6B6860] outline-none" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="bg-[#0A0A07] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#6B6860] outline-none" />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleOpenChatFirstTime}
                className="btn-primary flex items-center gap-2 text-xs rounded-2xl py-2.5 px-5 animate-pulse"
                style={{ background: 'linear-gradient(135deg, #FAD485, #F5A623)', color: '#000' }}>
                <Sparkles className="w-4 h-4" /> Especialista IA
              </button>
              <button 
                onClick={handleSync} 
                disabled={syncing}
                className="btn-secondary flex items-center gap-2 text-xs rounded-2xl py-2.5 px-5 disabled:opacity-50"
              >
                <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Puxar Dados'}
              </button>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Investimento Total" value={(insights?.funnel?.spend || 0).toFixed(2)} change="12.5" icon={DollarSign} prefix="R$ " />
            <MetricCard title="Conversas Iniciadas" value={metrics?.messagesStarted || 0} change={metrics?.change?.clicks || 5.2} icon={MessageCircle} />
            <MetricCard title="Custo por Mensagem" value={(metrics?.costPerMessage || 0).toFixed(2)} change="-3.1" icon={Target} prefix="R$ " />
            <MetricCard title="Cliques no Link" value={metrics?.clicks || 0} change="8.7" icon={MousePointer2} />
          </div>

          {/* Gráfico + Funil */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-3xl border border-white/5 space-y-6" style={{ background: '#0A0A07' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase">Histórico de Performance</h3>
                  <p className="text-[11px] text-[#6B6860] uppercase font-bold tracking-widest">Investimento vs Cliques</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#FAD485]" /><span className="text-[10px] text-white">Gasto</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-white/30" /><span className="text-[10px] text-white">Cliques</span></div>
                </div>
              </div>
              {history.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FAD485" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FAD485" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" stroke="#4A4840" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} />
                      <YAxis stroke="#4A4840" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.1)', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: '#FAD485' }} />
                      <Area type="monotone" dataKey="spend" stroke="#FAD485" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                      <Area type="monotone" dataKey="clicks" stroke="rgba(255,255,255,0.2)" strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center">
                  <p className="text-sm text-[#4A4840]">Clique em "Puxar Métricas" para carregar os dados da sua campanha.</p>
                </div>
              )}
            </div>

            {/* Funil */}
            <div className="p-6 rounded-3xl border border-white/5 space-y-6" style={{ background: '#0A0A07' }}>
              <h3 className="text-lg font-black text-white uppercase">Eficiência do Funil</h3>
              <div className="space-y-5">
                {[
                  { label: 'Alcance', value: insights?.funnel?.reach?.toLocaleString() || '0', pct: 100, color: '#FAD485' },
                  { label: 'Cliques', value: insights?.funnel?.clicks?.toLocaleString() || '0', pct: insights?.funnel?.reach ? ((insights.funnel.clicks / insights.funnel.reach) * 100).toFixed(1) : 0, color: '#A5B4FC' },
                  { label: 'Investimento', value: `R$ ${(insights?.funnel?.spend || 0).toFixed(2)}`, pct: 60, color: '#86EFAC' },
                ].map(item => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-white">{item.label}</span>
                      <span className="text-[#6B6860]">{item.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAD485]/03 border border-[#FAD485]/08">
                  <Sparkles className="w-4 h-4 text-[#FAD485] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-white uppercase mb-0.5">IA Insight</p>
                    <p className="text-[11px] text-[#6B6860]">Seu CTR está acima da média. Foque em retargeting para baixar o CPA.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela Campanhas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl border border-white/5" style={{ background: '#0A0A07' }}>
              <h3 className="text-lg font-black text-white uppercase mb-6">Performance de Campanhas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-[#6B6860] uppercase tracking-widest">
                      <th className="pb-4">Campanha</th>
                      <th className="pb-4 text-center">Cliques</th>
                      <th className="pb-4 text-center">Gastos</th>
                      <th className="pb-4 text-right">ROI Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[#E8E6DF]">
                    {insights?.campaigns?.map((camp, i) => {
                      const costPerClick = camp.spend / (camp.clicks || 1);
                      // Lógica leiga: Se CPA / Custo do Clique está barato, é bom (ex < R$2)
                      const isGoodROI = costPerClick < 2.0;

                      return (
                        <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-all">
                          <td className="py-4 font-bold">{camp.name}</td>
                          <td className="py-4 text-center">{camp.clicks}</td>
                          <td className="py-4 text-center">R$ {camp.spend.toFixed(2)}</td>
                          <td className="py-4 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isGoodROI ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {isGoodROI ? 'Trazendo ROI' : 'Revisar Custo'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-white/5" style={{ background: '#0A0A07' }}>
              <h3 className="text-lg font-black text-white uppercase mb-6">Top Criativos (Anúncios)</h3>
              <div className="space-y-4">
                {topAds.map((ad, i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-white/5">
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="text-xs font-bold text-white truncate">{ad.name}</h4>
                      <p className="text-[9px] text-[#6B6860] uppercase tracking-widest truncate">{ad.campaignName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-[#FAD485]">{ad.clicks} cliques</p>
                      <p className="text-[10px] text-[#4A4840]">por R$ {ad.spend.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {topAds.length === 0 && (
                  <p className="text-xs text-[#6B6860] text-center pt-8">Sem criativos rastreados no limite de datas.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI Chat Drawer */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#0A0A07] border-l border-white/10 shadow-2xl z-[100] flex flex-col animate-slide-left">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FAD485] to-[#F5A623] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase">Mark — Estrategista</h3>
                <p className="text-[10px] text-[#6B6860] uppercase">Mestre em Tráfego & Conversão</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-[#6B6860] hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 scrollbar-premium space-y-4">
            {chatHistory.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl ${m.sender === 'user' ? 'bg-[#FAD485] text-black rounded-tr-sm' : 'bg-white/5 border border-white/10 text-[#E8E6DF] rounded-tl-sm'}`}>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {processingChat && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-[#FAD485] animate-spin" />
                  <span className="text-xs text-[#6B6860]">Analisando seus dados...</span>
                </div>
              </div>
            )}
            
            {/* Render Sugestões da última mensagem da IA */}
            {!processingChat && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === 'ia' && chatHistory[chatHistory.length - 1].sugestoes?.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {chatHistory[chatHistory.length - 1].sugestoes.map((s, idx) => (
                  <button key={idx} onClick={() => handleSendChat(s)}
                    className="text-left text-[11px] p-2 rounded-xl border border-[#FAD485]/30 text-[#FAD485] hover:bg-[#FAD485]/10 transition-all opacity-80 hover:opacity-100 line-clamp-2">
                    "{s}"
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-black/40 border-t border-white/10">
            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 relative">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Pergunte sobre seus anúncios..."
                className="flex-1 bg-transparent border-none text-xs text-white px-3 outline-none" />
              <button onClick={() => handleSendChat()} disabled={processingChat || !chatInput.trim()}
                className="bg-[#FAD485] text-black p-2.5 rounded-xl disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && <WhatsAppModal onClose={() => setShowWhatsAppModal(false)} />}
    </div>
  );
}
