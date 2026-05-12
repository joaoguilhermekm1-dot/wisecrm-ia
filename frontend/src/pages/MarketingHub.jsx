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

// ── Componente de Card de Métrica ─────────────────────────────────────────
function MetricCard({ title, value, change, icon: Icon, prefix = '', suffix = '' }) {
  const isPositive = parseFloat(change) >= 0;
  return (
    <div className="p-6 rounded-3xl relative overflow-hidden group transition-all duration-300"
      style={{ background: '#0A0A07', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-[#FAD485]/10 transition-colors">
          <Icon className="w-5 h-5 text-[#FAD485]" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(parseFloat(change))}%
          </div>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-[#6B6860] text-[11px] font-black uppercase tracking-widest mb-1">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-sm text-[#9B9589] font-bold">{prefix}</span>
          <span className="text-3xl font-black text-white tracking-tight">{value}</span>
          <span className="text-sm text-[#9B9589] font-bold">{suffix}</span>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#FAD485] opacity-[0.02] rounded-full blur-2xl group-hover:opacity-[0.05] transition-opacity" />
    </div>
  );
}

// ── WhatsApp Modal ──────────────────────────────────────────────────────
function WhatsAppModal({ onClose }) {
  const [status, setStatus] = useState('LOADING');
  const [qr, setQr] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await whatsappApi.getStatus();
      setStatus(data.status);
      setQr(data.qr || null);
      if (data.status === 'DISCONNECTED' && !data.qr) {
        await whatsappApi.start();
      }
    } catch (e) {
      setStatus('ERROR');
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    connectSocket();
    const handler = (data) => {
      if (data.status) setStatus(data.status);
      if (data.qr) setQr(data.qr);
      if (data.status === 'QR_READY' && data.qr) setQr(data.qr);
      if (data.status === 'CONNECTED') {
        setQr(null);
        setStatus('CONNECTED');
      }
    };
    socket.on('whatsapp_status', handler);
    return () => socket.off('whatsapp_status', handler);
  }, []);

  const handleReset = async () => {
    setQr(null);
    setStatus('LOADING');
    try { await whatsappApi.reset(); } catch (e) {}
  };

  const statusConfig = {
    CONNECTED:    { label: 'Conectado',     color: '#22C55E', icon: Wifi },
    DISCONNECTED: { label: 'Desconectado',  color: '#EF4444', icon: WifiOff },
    CONNECTING:   { label: 'Conectando...', color: '#F59E0B', icon: Loader2 },
    LOADING:      { label: 'Carregando...', color: '#6B6860', icon: Loader2 },
    QR_READY:     { label: 'Aguardando Escaneamento', color: '#FAD485', icon: QrCode },
    ERROR:        { label: 'Erro de Conexão', color: '#EF4444', icon: AlertCircle },
  };

  const cfg = statusConfig[status] || statusConfig.DISCONNECTED;
  const StatusIcon = cfg.icon;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-[2.5rem] overflow-hidden animate-scale-up" style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.15)', boxShadow: '0 50px 100px rgba(0,0,0,1)' }}>
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)' }}>
              <MessageCircle className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">WhatsApp Hub</h3>
              <p className="text-[10px] text-[#6B6860] uppercase tracking-widest font-black">Wise Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 text-[#6B6860] transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 flex flex-col items-center">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full mb-8" style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
            <StatusIcon className={`w-5 h-5 ${status === 'LOADING' || status === 'CONNECTING' ? 'animate-spin' : ''}`} style={{ color: cfg.color }} />
            <span className="text-sm font-bold tracking-wide" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
          {qr && status === 'QR_READY' && (
            <div className="bg-white p-4 rounded-3xl mb-6 shadow-[0_0_40px_rgba(250,212,133,0.1)]">
              <img src={qr} alt="WhatsApp QR Code" className="w-64 h-64" />
            </div>
          )}
          <button onClick={handleReset} className="mt-4 flex items-center gap-2 text-xs font-bold text-[#6B6860] hover:text-white transition-all px-4 py-2 rounded-xl hover:bg-white/5">
            <RotateCcw className="w-4 h-4" /> Resetar Instância
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Conexões ─────────────────────────────────────────────────────────
function ConnectionsTab({ setShowWhatsAppModal, integrations, waStatus }) {
  const metaInt = integrations.find(i => i.type === 'META');
  const googleInt = integrations.find(i => i.type === 'GOOGLE');

  const handleMetaConnect = async () => {
    try {
      const res = await marketingApi.getMetaConnectUrl();
      window.location.href = res.data.url;
    } catch(e) { alert('Erro ao iniciar conexão com Meta'); }
  };

  const handleGoogleConnect = async () => {
    try {
      const res = await marketingApi.getGoogleConnectUrl();
      window.location.href = res.data.url;
    } catch(e) { alert('Erro ao iniciar conexão com Google'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* WhatsApp */}
        <div className="p-6 rounded-3xl border border-white/5 relative overflow-hidden" style={{ background: '#0A0A07' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#25D366]/10 border border-[#25D366]/20">
              <MessageCircle className="w-6 h-6 text-[#25D366]" />
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
              waStatus === 'CONNECTED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
              waStatus === 'QR_READY' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
              'bg-white/5 text-white/50 border-white/10'
            }`}>
              {waStatus === 'CONNECTED' ? 'Conectado' : waStatus === 'QR_READY' ? 'Aguardando QR' : 'Desconectado'}
            </div>
          </div>
          <h3 className="text-xl font-black text-white mb-2">WhatsApp Engine</h3>
          <p className="text-xs text-[#6B6860] mb-6">Conecte seu WhatsApp para habilitar automações e o chat centralizado do CRM.</p>
          <button onClick={() => setShowWhatsAppModal(true)} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
            <Settings2 className="w-4 h-4" /> Gerenciar Conexão
          </button>
        </div>

        {/* Meta Ads */}
        <div className="p-6 rounded-3xl border border-white/5 relative overflow-hidden" style={{ background: '#0A0A07' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#1877F2]/10 border border-[#1877F2]/20">
              <Target className="w-6 h-6 text-[#1877F2]" />
            </div>
            {metaInt ? (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                <CheckCircle2 className="w-3 h-3" /> Conectado
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white/5 text-white/50">Necessário</div>
            )}
          </div>
          <h3 className="text-xl font-black text-white mb-2">Meta Ads</h3>
          <p className="text-xs text-[#6B6860] mb-6">Integre suas campanhas do Facebook e Instagram para puxar métricas automáticas.</p>
          <button onClick={handleMetaConnect} className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${metaInt ? 'bg-white/5 text-[#6B6860] cursor-default' : 'bg-[#1877F2] text-white hover:bg-[#1877F2]/90'}`}>
            {metaInt ? <><Link2 className="w-4 h-4" /> Sincronizado</> : <><Link2 className="w-4 h-4" /> Conectar Facebook</>}
          </button>
        </div>

        {/* Google Ads */}
        <div className="p-6 rounded-3xl border border-white/5 relative overflow-hidden" style={{ background: '#0A0A07' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#EA4335]/10 border border-[#EA4335]/20">
              <BarChart3 className="w-6 h-6 text-[#EA4335]" />
            </div>
            {googleInt ? (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                <CheckCircle2 className="w-3 h-3" /> Conectado
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white/5 text-white/50">Opcional</div>
            )}
          </div>
          <h3 className="text-xl font-black text-white mb-2">Google Ads</h3>
          <p className="text-xs text-[#6B6860] mb-6">Acompanhe palavras-chave e métricas de conversão das suas campanhas de pesquisa.</p>
          <button onClick={handleGoogleConnect} className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${googleInt ? 'bg-white/5 text-[#6B6860] cursor-default' : 'bg-white text-black hover:bg-gray-200'}`}>
            {googleInt ? <><Link2 className="w-4 h-4" /> Sincronizado</> : <><Link2 className="w-4 h-4" /> Conectar Google</>}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Marketing Hub Principal ───────────────────────────────────────────────
export default function MarketingHub() {
  const [activeTab, setActiveTab] = useState('performance');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  
  // Conexões e Contas
  const [integrations, setIntegrations] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Filtros Globais
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Dados de Performance
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // AI Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [processingChat, setProcessingChat] = useState(false);
  const [waStatus, setWaStatus] = useState('LOADING');

  // Carregar integrações e contas
  useEffect(() => {
    async function init() {
      try {
        const [intsRes, accsRes, waRes] = await Promise.all([
          marketingApi.getIntegrations(),
          marketingApi.getAdAccounts(),
          whatsappApi.getStatus()
        ]);
        setIntegrations(intsRes.data);
        setWaStatus(waRes.data.status);
        
        // Sempre garantimos uma conta mock para testes, mesmo sem conexão oficial.
        let accounts = accsRes.data;
        if (accounts.length === 0) {
          accounts = [{ id: 'act_mock_meta', name: 'Wise Demo Account', platform: 'META', displayName: '[MOCK] Wise Demo Account' }];
        }
        
        setAdAccounts(accounts);
        if (accounts.length > 0) {
          setSelectedAccount({ id: accounts[0].id, platform: accounts[0].platform });
        }
      } catch (err) {
        console.error('Erro de init:', err);
      } finally {
        setLoading(false);
      }
    }
    init();

    // Socket status listeners
    connectSocket();
    const waHandler = (data) => { if (data.status) setWaStatus(data.status); };
    socket.on('whatsapp_status', waHandler);
    return () => socket.off('whatsapp_status', waHandler);
  }, []);

  // Carregar Insights quando a conta muda
  const fetchInsights = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const res = await marketingApi.getAdInsights(selectedAccount.id, selectedAccount.platform, startDate, endDate);
      setInsights(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, startDate, endDate]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleSync = async () => {
    if (!selectedAccount) return;
    setSyncing(true);
    try {
      await marketingApi.syncAdInsights(selectedAccount.id, selectedAccount.platform);
      await fetchInsights();
    } catch (err) {
      alert('Erro ao sincronizar dados.');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenChatFirstTime = () => {
    setChatOpen(true);
    if (chatHistory.length === 0) {
      handleSendChat("Faça uma análise rápida do meu funil de anúncios deste período e me dê 3 sugestões práticas para melhorar o meu CPL (Custo por Lead).");
    }
  };

  const handleSendChat = async (messageOverride = null) => {
    const text = messageOverride || chatInput;
    if (!text.trim()) return;
    
    setChatInput('');
    setChatHistory(prev => [...prev, { sender: 'user', content: text }]);
    setProcessingChat(true);

    try {
      const payload = {
        adAccountId: selectedAccount?.id,
        platform: selectedAccount?.platform,
        metrics: insights?.funnel,
        history: insights?.history,
        campaigns: insights?.campaigns,
        userQuery: text
      };
      const res = await marketingApi.sendAdChat(payload);
      setChatHistory(prev => [...prev, { sender: 'ia', content: res.data.reply, sugestoes: res.data.sugestoes }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'ia', content: 'Erro ao analisar métricas.' }]);
    } finally {
      setProcessingChat(false);
    }
  };

  return (
    <div className="h-[calc(100vh-88px)] flex flex-col space-y-6 overflow-y-auto scrollbar-premium pr-2 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#FAD485]" /> Marketing Dashboard
          </h1>
          <p className="text-xs mt-1 text-[#6B6860] font-medium">Sincronização automática de métricas Meta & Google.</p>
        </div>

        {/* Filters */}
        {activeTab === 'performance' && (
          <div className="flex items-center gap-3">
            <select 
              value={selectedAccount?.id || ''} 
              onChange={e => {
                const acc = adAccounts.find(a => a.id === e.target.value);
                if (acc) setSelectedAccount({ id: acc.id, platform: acc.platform });
              }}
              className="bg-[#0A0A07] border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[#FAD485]/40 transition-all"
            >
              {adAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.displayName}</option>
              ))}
            </select>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-[#0A0A07] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#6B6860] outline-none" />
            <span className="text-[#4A4840]">até</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-[#0A0A07] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#6B6860] outline-none" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        <button onClick={() => setActiveTab('performance')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'performance' ? 'text-[#FAD485]' : 'text-[#6B6860] hover:text-white'}`}>
          Performance
          {activeTab === 'performance' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FAD485] shadow-[0_0_8px_rgba(250,212,133,0.5)]" />}
        </button>
        <button onClick={() => setActiveTab('connections')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'connections' ? 'text-[#FAD485]' : 'text-[#6B6860] hover:text-white'}`}>
          Conexões / APIs
          {activeTab === 'connections' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FAD485] shadow-[0_0_8px_rgba(250,212,133,0.5)]" />}
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="wise-spinner" />
        </div>
      ) : activeTab === 'connections' ? (
        <ConnectionsTab setShowWhatsAppModal={setShowWhatsAppModal} integrations={integrations} waStatus={waStatus} />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Sync & IA Buttons */}
          <div className="flex justify-end gap-3 mb-2">
            <button onClick={handleOpenChatFirstTime} className="btn-primary flex items-center gap-2 text-xs rounded-2xl py-2 px-4 shadow-[0_4px_15px_rgba(250,212,133,0.15)] animate-pulse-gold">
              <Sparkles className="w-4 h-4" /> Especialista IA
            </button>
            <button onClick={handleSync} disabled={syncing} className="btn-secondary flex items-center gap-2 text-xs rounded-2xl py-2 px-4 disabled:opacity-50">
              <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Puxar Dados da Conta'}
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Investimento Total" value={(insights?.funnel?.spend || 0).toFixed(2)} icon={DollarSign} prefix="R$ " />
            <MetricCard title="Conversas / Leads" value={insights?.funnel?.leads || insights?.funnel?.messagesStarted || 0} icon={MessageCircle} />
            <MetricCard title="Custo por Conversa" value={(insights?.funnel?.costPerLead || insights?.funnel?.costPerMessage || 0).toFixed(2)} icon={Target} prefix="R$ " />
            <MetricCard title="Cliques no Anúncio" value={insights?.funnel?.clicks || 0} icon={MousePointer2} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico Histórico */}
            <div className="lg:col-span-2 p-6 rounded-3xl border border-white/5" style={{ background: '#0A0A07' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white uppercase">Histórico de Performance</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#FAD485]" /><span className="text-[10px] text-white">Gasto</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /><span className="text-[10px] text-white">Cliques</span></div>
                </div>
              </div>
              <div className="h-[280px]">
                {insights?.history?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={insights.history}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FAD485" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FAD485" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" stroke="#4A4840" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} />
                      <YAxis stroke="#4A4840" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" dataKey="spend" name="Gasto (R$)" stroke="#FAD485" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                      <Area type="monotone" dataKey="clicks" name="Cliques" stroke="#60A5FA" strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-[#4A4840]">Clique em "Puxar Dados da Conta" para carregar as métricas.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Funil Resumo */}
            <div className="p-6 rounded-3xl border border-white/5 space-y-6" style={{ background: '#0A0A07' }}>
              <h3 className="text-lg font-black text-white uppercase">Eficiência do Funil</h3>
              <div className="space-y-5">
                {[
                  { label: 'Alcance', value: insights?.funnel?.reach?.toLocaleString() || '0', pct: 100, color: '#FAD485' },
                  { label: 'Cliques', value: insights?.funnel?.clicks?.toLocaleString() || '0', pct: insights?.funnel?.reach ? ((insights.funnel.clicks / insights.funnel.reach) * 100).toFixed(1) : 0, color: '#60A5FA' },
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
            </div>
          </div>

          {/* Tabela de Campanhas */}
          <div className="p-6 rounded-3xl border border-white/5 bg-[#0A0A07]">
            <h3 className="text-lg font-black text-white uppercase mb-6">Performance de Campanhas Ativas</h3>
            <div className="overflow-x-auto scrollbar-premium">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-[#6B6860] uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 px-2">Campanha</th>
                    <th className="pb-4 px-2 text-center">Cliques</th>
                    <th className="pb-4 px-2 text-center">Gastos</th>
                    <th className="pb-4 px-2 text-right">Status ROI</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-[#E8E6DF]">
                  {insights?.campaigns?.length > 0 ? insights.campaigns.map((camp, i) => {
                    const cpc = camp.spend / (camp.clicks || 1);
                    const isGoodROI = cpc < 2.0;
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="py-4 px-2 font-bold">{camp.name}</td>
                        <td className="py-4 px-2 text-center">{camp.clicks}</td>
                        <td className="py-4 px-2 text-center">R$ {camp.spend.toFixed(2)}</td>
                        <td className="py-4 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isGoodROI ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {isGoodROI ? 'Trazendo ROI' : 'Revisar Custo'}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="4" className="py-8 text-center text-[#4A4840]">Nenhuma campanha rastreada no período.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Drawer */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#0A0A07] border-l border-white/10 shadow-2xl z-[100] flex flex-col animate-slide-left">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FAD485] to-[#F5C842] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase">IA Marketer</h3>
                <p className="text-[10px] text-[#6B6860] uppercase">Mestre em Conversão</p>
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
            {!processingChat && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sugestoes?.length > 0 && (
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
