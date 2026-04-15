import React, { useState, useEffect } from 'react';
import {
  User, Lock, CheckCircle2, AlertCircle, Eye, EyeOff,
  Save, Wifi, WifiOff, MessageCircle, Target, Activity,
  ExternalLink, RefreshCcw, Info
} from 'lucide-react';
import { authApi, marketingApi, whatsappApi } from '../services/api';

// ── Toast helper ───────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

// ── Section Wrapper ────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0A0A07', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="p-2 rounded-xl" style={{ background: 'rgba(250,212,133,0.08)' }}>
          <Icon className="w-4 h-4 text-[#FAD485]" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white">{title}</h2>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: '#6B6860' }}>{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Integration Status Card ────────────────────────────────────────────────
function IntegStatusCard({ name, icon: Icon, color, status, hint, actionLabel, onAction, loading }) {
  const isConnected = status === 'CONNECTED';
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-[11px] font-bold" style={{ color: isConnected ? '#86EFAC' : '#FCA5A5' }}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        {hint && <p className="text-[10px] mt-1" style={{ color: '#4A4840' }}>{hint}</p>}
      </div>
      {actionLabel && (
        <button onClick={onAction} disabled={loading}
          className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 disabled:opacity-50"
          style={{ background: 'rgba(250,212,133,0.06)', color: '#FAD485', border: '1px solid rgba(250,212,133,0.12)' }}>
          {loading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : actionLabel}
        </button>
      )}
    </div>
  );
}

export default function Settings() {
  const { toast, show: showToast } = useToast();

  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [profileName, setProfileName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  // Integration state
  const [integrations, setIntegrations] = useState([]);
  const [waStatus, setWaStatus] = useState('LOADING');
  const [loadingInteg, setLoadingInteg] = useState(true);

  // Load profile
  useEffect(() => {
    authApi.getProfile().then(({ data }) => {
      setProfile(data);
      setProfileName(data.name || '');
    }).catch(() => {});
  }, []);

  // Load integrations + WA real status
  useEffect(() => {
    Promise.all([
      marketingApi.getIntegrations(),
      whatsappApi.getStatus()
    ]).then(([integRes, waRes]) => {
      setIntegrations(integRes.data);
      setWaStatus(waRes.data.status || 'DISCONNECTED');
    }).catch(() => {}).finally(() => setLoadingInteg(false));
  }, []);

  const getIntegStatus = (type) => integrations.find(i => i.type === type)?.status || 'DISCONNECTED';

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    setSavingProfile(true);
    try {
      const { data } = await authApi.updateProfile({ name: profileName.trim() });
      setProfile(data);
      // Atualizar nome no localStorage também
      const stored = JSON.parse(localStorage.getItem('wise_user') || '{}');
      localStorage.setItem('wise_user', JSON.stringify({ ...stored, name: data.name }));
      showToast('✅ Perfil atualizado com sucesso!');
    } catch (err) {
      showToast(err.response?.data?.error || '❌ Erro ao salvar perfil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw) {
      showToast('Preencha todos os campos de senha.', 'error');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      showToast('As novas senhas não coincidem.', 'error');
      return;
    }
    if (pwForm.newPw.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current: '', newPw: '', confirm: '' });
      showToast('✅ Senha alterada com sucesso!');
    } catch (err) {
      showToast(err.response?.data?.error || '❌ Senha atual incorreta.', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const PwInput = ({ label, stateKey, placeholder }) => (
    <div>
      <label className="text-[10px] uppercase font-bold mb-1.5 block" style={{ color: '#6B6860' }}>{label}</label>
      <div className="relative">
        <input
          type={showPw[stateKey] ? 'text' : 'password'}
          placeholder={placeholder}
          value={pwForm[stateKey]}
          onChange={e => setPwForm(f => ({ ...f, [stateKey]: e.target.value }))}
          className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: '#060604', border: '1px solid rgba(250,212,133,0.12)' }}
          onFocus={e => e.target.style.borderColor = 'rgba(250,212,133,0.35)'}
          onBlur={e => e.target.style.borderColor = 'rgba(250,212,133,0.12)'}
        />
        <button type="button" onClick={() => setShowPw(p => ({ ...p, [stateKey]: !p[stateKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: '#4A4840' }}>
          {showPw[stateKey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in pb-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-24 right-8 z-[100] animate-fade-in px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 max-w-sm ${
          toast.type === 'error'
            ? 'bg-red-950 border-red-500/30 text-red-200'
            : 'bg-[#0A0A07] border-[#FAD485]/20 text-white'
        }`}>
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            : <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
          <p className="text-sm font-bold">{toast.msg}</p>
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Configurações</h1>
        <p className="text-sm mt-1" style={{ color: '#6B6860' }}>Gerencie seu perfil e conexões do Wise CRM</p>
      </div>

      {/* ── Perfil ── */}
      <Section icon={User} title="Perfil" subtitle={profile.email || 'Carregando...'}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold mb-1.5 block" style={{ color: '#6B6860' }}>
              Nome de exibição
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Seu nome..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                style={{ background: '#060604', border: '1px solid rgba(250,212,133,0.12)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(250,212,133,0.35)'}
                onBlur={e => e.target.style.borderColor = 'rgba(250,212,133,0.12)'}
                onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
              />
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || profileName === profile.name}
                className="btn-primary px-5 text-sm flex items-center gap-2 disabled:opacity-40"
              >
                {savingProfile ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold mb-1.5 block" style={{ color: '#6B6860' }}>E-mail (somente leitura)</label>
            <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.02)', color: '#6B6860', border: '1px solid rgba(255,255,255,0.04)' }}>
              {profile.email || '—'}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Alterar Senha ── */}
      <Section icon={Lock} title="Alterar Senha" subtitle="Mínimo de 6 caracteres">
        <div className="space-y-4">
          <PwInput label="Senha atual" stateKey="current" placeholder="••••••••" />
          <PwInput label="Nova senha" stateKey="newPw" placeholder="Nova senha forte..." />
          <PwInput label="Confirmar nova senha" stateKey="confirm" placeholder="Repita a nova senha..." />
          <button
            onClick={handleChangePassword}
            disabled={savingPw || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-40 mt-2"
          >
            {savingPw ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            {savingPw ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      </Section>

      {/* ── Integrações ── */}
      <Section icon={Activity} title="Status das Integrações" subtitle="Gerencie as conexões ativas do CRM">
        <div className="space-y-3">
          {loadingInteg ? (
            [1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)
          ) : (
            <>
              <IntegStatusCard
                name="WhatsApp Business"
                icon={MessageCircle}
                color="#25D366"
                status={waStatus}
                hint="Powered by Baileys — conexão em tempo real"
                actionLabel="Gerenciar"
                onAction={() => window.location.href = '/marketing?tab=integrations'}
              />
              <IntegStatusCard
                name="Meta Ads (Facebook)"
                icon={Target}
                color="#1877F2"
                status={getIntegStatus('META')}
                hint={getIntegStatus('META') === 'CONNECTED' ? 'Métricas sincronizadas automaticamente' : 'Vá em Marketing Hub → Conexões para conectar'}
                actionLabel="Ir para Marketing"
                onAction={() => window.location.href = '/marketing'}
              />
              <IntegStatusCard
                name="Google Ads"
                icon={Activity}
                color="#EA4335"
                status={getIntegStatus('GOOGLE')}
                hint={getIntegStatus('GOOGLE') === 'CONNECTED' ? 'Google Ads conectado' : 'Vá em Marketing Hub → Conexões para conectar'}
                actionLabel="Ir para Marketing"
                onAction={() => window.location.href = '/marketing'}
              />
            </>
          )}
        </div>
      </Section>

      {/* ── Info sobre API Keys ── */}
      <div className="rounded-2xl p-5 flex items-start gap-3"
        style={{ background: 'rgba(250,212,133,0.03)', border: '1px solid rgba(250,212,133,0.10)' }}>
        <Info className="w-4 h-4 text-[#FAD485] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-white mb-1">Sobre as Chaves de API</p>
          <p className="text-xs leading-relaxed" style={{ color: '#6B6860' }}>
            As chaves de integração (Anthropic, Apify, Meta App ID, etc.) são configuradas diretamente no{' '}
            <code className="px-1 py-0.5 rounded text-[#FAD485]" style={{ background: '#060604' }}>.env</code>{' '}
            do backend por razões de segurança. Elas nunca devem ser expostas via interface web.
          </p>
          <p className="text-xs mt-2" style={{ color: '#4A4840' }}>
            Edite o arquivo{' '}
            <code className="px-1 py-0.5 rounded text-[#FAD485]" style={{ background: '#060604' }}>
              backend/.env
            </code>{' '}
            e reinicie o servidor para ativar novas chaves.
          </p>
        </div>
      </div>

    </div>
  );
}
