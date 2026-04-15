import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm]               = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao conectar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#000000' }}>

      {/* LEFT — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #060604 0%, #000000 100%)' }}>

        {/* Background subtle grid */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 60% 140%, rgba(250,212,133,0.06) 0%, transparent 60%)',
          }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(250,212,133,1) 1px, transparent 1px), linear-gradient(90deg, rgba(250,212,133,1) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/wise-logo.jpg" alt="Wise CRM" className="rounded-xl" style={{ width: '46px', height: '46px', objectFit: 'cover' }} />
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">WISE CRM</h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5" style={{ color: '#FAD485' }}>Intelligence</p>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
            Transforme dados<br />
            em <span style={{ background: 'linear-gradient(135deg,#FAD485,#F5C842)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>decisões.</span><br />
            Decisões em<br />crescimento.
          </h2>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: '#6B6860' }}>
            Seu sistema operacional de crescimento — com inteligência artificial integrada ao processo comercial.
          </p>

          {/* Features */}
          <div className="space-y-3 pt-2">
            {[
              'Pipeline de leads com drag & drop',
              'IA analisando conversas em tempo real',
              'Métricas reais de Meta e Google Ads',
              'Prospecção automatizada com Apify',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: '#FAD485', boxShadow: '0 0 6px rgba(250,212,133,0.6)' }} />
                <p className="text-sm" style={{ color: '#9B9589' }}>{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: '#4A4840' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#86EFAC', boxShadow: '0 0 6px rgba(134,239,172,0.6)' }} />
            Sistemas ativos
          </div>
          <span style={{ color: '#1A1810' }}>·</span>
          <span className="text-xs" style={{ color: '#2A2820' }}>Wise Company © 2026</span>
        </div>
      </div>

      {/* RIGHT — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <img src="/wise-logo.jpg" alt="Wise CRM" className="rounded-xl" style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
            <span className="text-lg font-black text-white">WISE CRM</span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white tracking-tight">
              {isRegister ? 'Criar conta' : 'Acessar sistema'}
            </h3>
            <p className="text-sm mt-1.5" style={{ color: '#6B6860' }}>
              {isRegister ? 'Configure seu acesso à plataforma.' : 'Entre no seu painel de comando.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl flex items-start gap-2.5 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <span className="text-sm" style={{ color: '#FCA5A5' }}>⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: '#6B6860' }}>
                  Nome completo
                </label>
                <input
                  type="text"
                  required={isRegister}
                  placeholder="Ex: João Kaminski"
                  className="input-field"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: '#6B6860' }}>
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                className="input-field"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: '#6B6860' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="input-field pr-10"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#4A4840' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FAD485'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4A4840'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 text-sm"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <div className="wise-spinner w-4 h-4" style={{ borderTopColor: '#000' }} />
              ) : (
                <>
                  {isRegister ? 'Criar minha conta' : 'Entrar no sistema'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm transition-colors"
              style={{ color: '#4A4840' }}
              onMouseEnter={e => e.currentTarget.style.color = '#FAD485'}
              onMouseLeave={e => e.currentTarget.style.color = '#4A4840'}
            >
              {isRegister ? '← Já tem conta? Entrar' : 'Não tem conta? Criar agora →'}
            </button>
          </div>

          {/* AI Badge */}
          <div className="mt-10 flex items-center justify-center gap-2 py-2 rounded-xl"
            style={{ background: 'rgba(250,212,133,0.04)', border: '1px solid rgba(250,212,133,0.08)' }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#FAD485' }} />
            <p className="text-[11px] font-semibold" style={{ color: '#4A4840' }}>Powered by Wise Intelligence IA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
