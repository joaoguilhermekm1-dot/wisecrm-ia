import React, { useState, useEffect } from 'react';
import {
  Users, Target, TrendingUp, Award, ArrowRight, Sparkles,
  ChevronUp, ChevronDown, Flame, MessageSquare, Clock,
  Zap, BarChart3, Activity, AlertTriangle
} from 'lucide-react';
import { leadsApi, analyticsApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const STATUS_LABEL = {
  NEW: 'Novo',
  'DIAGNÓSTICO': 'Diagnóstico',
  PROPOSTA: 'Proposta',
  FECHADO: 'Fechado',
  PERDIDO: 'Perdido',
};

const STATUS_BADGE = {
  NEW:          { bg: 'rgba(250,212,133,0.10)', color: '#FAD485',   border: 'rgba(250,212,133,0.20)' },
  'DIAGNÓSTICO':{ bg: 'rgba(99,102,241,0.10)',  color: '#A5B4FC',   border: 'rgba(99,102,241,0.20)' },
  PROPOSTA:     { bg: 'rgba(139,92,246,0.10)',  color: '#C4B5FD',   border: 'rgba(139,92,246,0.20)' },
  FECHADO:      { bg: 'rgba(34,197,94,0.10)',   color: '#86EFAC',   border: 'rgba(34,197,94,0.20)' },
  PERDIDO:      { bg: 'rgba(239,68,68,0.10)',   color: '#FCA5A5',   border: 'rgba(239,68,68,0.20)' },
};

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, delta, loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-8 w-8 rounded-lg mb-4" />
        <div className="skeleton h-3 w-24 rounded mb-2" />
        <div className="skeleton h-7 w-16 rounded" />
      </div>
    );
  }
  return (
    <div className="card group cursor-default animate-fade-in border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}06 0%, transparent 70%)` }} />

      <div className="flex items-start justify-between mb-5 relative">
        <div className="p-2.5 rounded-xl" style={{ background: color + '18' }}>
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
        {delta !== undefined && (
          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              color: delta >= 0 ? '#86EFAC' : '#FCA5A5',
              background: delta >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            }}>
            {delta >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: '#6B6860' }}>{label}</p>
      <h3 className="text-2xl font-black text-white">{value}</h3>
      {sub && <p className="text-[11px] mt-1" style={{ color: '#4A4840' }}>{sub}</p>}
    </div>
  );
}

// ── Funnel Bar ─────────────────────────────────────────────────────────────
function FunnelBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0 text-right">
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color }}>{label}</span>
      </div>
      <div className="flex-1 h-6 rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div
          className="h-full rounded-lg flex items-center pl-3 transition-all duration-700"
          style={{ width: `${Math.max(pct, 4)}%`, background: `${color}22`, border: `1px solid ${color}30` }}
        >
          <span className="text-[10px] font-black" style={{ color }}>{count}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold w-10 text-right shrink-0" style={{ color: '#4A4840' }}>{pct}%</span>
    </div>
  );
}

// ── Activity Item ──────────────────────────────────────────────────────────
function ActivityItem({ lead, onClick }) {
  const temp = lead.temperature || 0;
  const tempColor = temp >= 70 ? '#EF4444' : temp >= 40 ? '#F59E0B' : '#3B82F6';
  const status = STATUS_BADGE[lead.status] || STATUS_BADGE.NEW;

  return (
    <div
      onClick={() => onClick(lead)}
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
      style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'transparent' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(250,212,133,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
        style={{ background: `${tempColor}12`, color: tempColor }}>
        {(lead.name || 'L').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{lead.name}</p>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: '#4A4840' }}>
          {lead.source}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
          style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
          {STATUS_LABEL[lead.status] || lead.status}
        </span>
        {temp > 0 && (
          <div className="flex items-center gap-1" style={{ color: tempColor }}>
            <Flame className="w-2.5 h-2.5" />
            <span className="text-[9px] font-black">{temp}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('wise_user') || '{}');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    Promise.all([leadsApi.getAll(), analyticsApi.getGlobalMetrics()])
      .then(([resLeads, resAnalytics]) => {
        setLeads(resLeads.data);
        setAnalytics(resAnalytics.data);
      })
      .catch(err => console.error('Erro ao carregar dashboard', err))
      .finally(() => setLoading(false));
  }, []);

  const total      = leads.length;
  const fechados   = leads.filter(l => l.status === 'FECHADO' || l.status === 'FECHAMENTO').length;
  const perdidos   = leads.filter(l => l.status === 'PERDIDO' || l.status === 'LOST').length;
  const ativos     = total - fechados - perdidos;
  const conversao  = total ? ((fechados / total) * 100).toFixed(1) : '0';

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const hotLeads = leads
    .filter(l => l.temperature >= 60 && !['FECHADO', 'PERDIDO', 'LOST'].includes(l.status))
    .sort((a, b) => b.temperature - a.temperature)
    .slice(0, 4);

  // Funil visual
  const funnelData = [
    { label: 'Novos', count: leads.filter(l => ['NEW','NOVO','PENDENTE'].includes((l.status||'').toUpperCase())).length, color: '#FAD485' },
    { label: 'Diagnóst.', count: leads.filter(l => ['DIAGNÓSTICO','DIAGNOSTICO','QUALIFICADO'].includes((l.status||'').toUpperCase())).length, color: '#A5B4FC' },
    { label: 'Proposta', count: leads.filter(l => ['PROPOSTA','NEGOCIAÇÃO'].includes((l.status||'').toUpperCase())).length, color: '#C4B5FD' },
    { label: 'Fechados', count: fechados, color: '#86EFAC' },
    { label: 'Perdidos', count: perdidos, color: '#FCA5A5' },
  ];

  const stats = [
    { label: 'Total de Leads',    value: total.toString(),    icon: Users,      color: '#FAD485', sub: 'No funil ativo' },
    { label: 'Taxa de Conversão', value: `${conversao}%`,     icon: Target,     color: '#86EFAC', sub: `${fechados} fechados` },
    { label: 'Leads Ativos',      value: ativos.toString(),    icon: Activity,   color: '#A5B4FC', sub: 'Em negociação' },
    { label: 'Temperatura Média', value: `${analytics?.metrics?.avgTemp || 0}°`, icon: Flame, color: '#EF4444', sub: 'Potencial do funil' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* Greeting Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#6B6860' }}>
            {greeting}, <span style={{ color: '#FAD485' }}>{user.name || 'Usuário'}</span> 👋
          </p>
          <h1 className="text-3xl font-black text-white tracking-tight">Painel Executivo</h1>
          <p className="text-sm mt-1" style={{ color: '#6B6860' }}>
            Visão estratégica do seu CRM com IA.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/leads')}
            className="btn-secondary text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Pipeline</span>
          </button>
          <button onClick={() => navigate('/conversations')}
            className="btn-primary text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Atender com IA</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      {/* AI Insight Banner */}
      <div className="rounded-3xl p-6 relative overflow-hidden border"
        style={{ background: 'linear-gradient(135deg, #0A0A07 0%, #060604 100%)', borderColor: 'rgba(250,212,133,0.12)' }}>
        {/* Decorative glow */}
        <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: '#FAD485' }} />
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Target className="w-32 h-32 text-[#FAD485]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(250,212,133,0.12)' }}>
              <Sparkles className="w-4 h-4 text-[#FAD485]" />
            </div>
            <h3 className="text-base font-black text-white uppercase italic tracking-wider">Insight Estratégico</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full ml-2"
              style={{ background: 'rgba(250,212,133,0.06)', border: '1px solid rgba(250,212,133,0.12)' }}>
              <Zap className="w-2.5 h-2.5 text-[#FAD485]" />
              <span className="text-[9px] font-bold text-[#FAD485] uppercase tracking-wider">IA Ativa</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 max-w-xl">
              <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
            </div>
          ) : !analytics?.ai_insight ? (
            <p className="text-[#6B6860] text-sm">Dados insuficientes para análise profunda no momento.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl">
              {[
                { key: 'diagnostico_erro', label: 'Diagnóstico Crítico', color: '#FCA5A5', dot: '#EF4444' },
                { key: 'solucao_rapida',   label: 'Solução Rápida',      color: '#86EFAC', dot: '#22C55E' },
                { key: 'plano_acao',       label: 'Plano de Ação',       color: '#FAD485', dot: '#FAD485' },
              ].map(({ key, label, color, dot }) => (
                <div key={key} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: `${dot}04`, border: `1px solid ${dot}12` }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: dot }} />
                  <div>
                    <p className="text-[10px] uppercase font-bold mb-1" style={{ color }}>{label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.80)' }}>
                      {analytics.ai_insight[key]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Funil Visual */}
        <div className="card border-white/5 bg-[#0A0A07]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FAD485]" /> Funil
            </h3>
            <button onClick={() => navigate('/leads')}
              className="text-[10px] text-[#FAD485] hover:underline font-bold uppercase tracking-wider">
              Ver Kanban
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              [1,2,3,4,5].map(i => <div key={i} className="h-6 rounded-lg bg-white/5 animate-pulse" />)
            ) : (
              funnelData.map(f => (
                <FunnelBar key={f.label} total={total} {...f} />
              ))
            )}
          </div>
          {!loading && total > 0 && (
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-bold" style={{ color: '#6B6860' }}>Conversão geral</span>
              <span className="text-lg font-black" style={{ color: '#86EFAC' }}>{conversao}%</span>
            </div>
          )}
        </div>

        {/* Hot Leads */}
        <div className="card border-white/5 bg-[#0A0A07]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" /> Leads Quentes
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold">Prioridade Alta</span>
          </div>

          <div className="space-y-2">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)
            ) : hotLeads.length === 0 ? (
              <div className="py-8 text-center">
                <Flame className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: '#EF4444' }} />
                <p className="text-xs" style={{ color: '#6B6860' }}>Nenhum lead quente no momento.</p>
              </div>
            ) : hotLeads.map(lead => (
              <div key={lead.id} onClick={() => navigate(`/leads?leadId=${lead.id}`)}
                className="p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
                style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.10)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.10)'}
              >
                <div>
                  <p className="text-sm font-bold text-white">{lead.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#6B6860' }}>{lead.summary || 'Lead engajado.'}</p>
                </div>
                <div className="text-right ml-2 shrink-0">
                  <p className="text-lg font-black text-red-400">{lead.temperature}%</p>
                  <p className="text-[9px] uppercase tracking-wider text-red-400/50">Temp.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card border-white/5 bg-[#0A0A07]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A5B4FC]" /> Atividade Recente
            </h3>
            <button onClick={() => navigate('/leads')}
              className="text-[10px] text-[#FAD485] hover:underline font-bold uppercase tracking-wider">
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)
            ) : recentLeads.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-xs" style={{ color: '#6B6860' }}>Nenhum lead ainda.</p>
                <button onClick={() => navigate('/leads')} className="btn-primary text-xs mt-4 mx-auto">
                  + Adicionar Lead
                </button>
              </div>
            ) : recentLeads.map(lead => (
              <ActivityItem
                key={lead.id}
                lead={lead}
                onClick={() => navigate(`/leads?leadId=${lead.id}`)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Prospectar Leads',    icon: Zap,          route: '/discovery',    color: '#FAD485' },
          { label: 'Ver Pipeline',         icon: BarChart3,    route: '/leads',        color: '#A5B4FC' },
          { label: 'Caixa de Entrada',     icon: MessageSquare,route: '/conversations',color: '#86EFAC' },
          { label: 'Marketing Hub',        icon: TrendingUp,   route: '/marketing',    color: '#C4B5FD' },
        ].map(({ label, icon: Icon, route, color }) => (
          <button key={route} onClick={() => navigate(route)}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all text-left group"
            style={{ background: '#0A0A07', border: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}20`; e.currentTarget.style.background = `${color}05`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.background = '#0A0A07'; }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              style={{ background: `${color}12` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <span className="text-sm font-bold text-white">{label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
