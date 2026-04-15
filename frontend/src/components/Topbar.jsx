import React from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/':              { title: 'Dashboard',              subtitle: 'Visão geral do seu funil comercial' },
  '/leads':         { title: 'Pipeline de Leads',      subtitle: 'Gerencie e mova seus leads pelo funil' },
  '/conversations': { title: 'Conversas',              subtitle: 'Inbox centralizado com IA integrada' },
  '/marketing':     { title: 'Marketing Hub',          subtitle: 'Métricas reais de Meta e Google Ads' },
  '/discovery':     { title: 'Centro de Descoberta',   subtitle: 'Prospecção automatizada com IA' },
  '/map':           { title: 'Mapa Comercial',         subtitle: 'Seu processo visual de vendas' },
  '/settings':      { title: 'Configurações',          subtitle: 'Personalize sua conta e integrações' },
};

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  return (
    <header
      className="h-14 px-6 flex items-center justify-between sticky top-0 z-20"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(250,212,133,0.07)',
      }}
    >
      {/* Page Info */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-white leading-none">{page.title}</h2>
          <p className="text-[11px] mt-0.5" style={{ color: '#4A4840' }}>{page.subtitle}</p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* AI Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(250,212,133,0.06)', border: '1px solid rgba(250,212,133,0.12)' }}>
          <Sparkles className="w-3 h-3" style={{ color: '#FAD485' }} />
          <span className="text-[10px] font-semibold" style={{ color: '#FAD485', letterSpacing: '0.05em' }}>IA Ativa</span>
        </div>

        {/* Bell */}
        <button
          className="p-2 rounded-xl transition-all"
          style={{ color: '#6B6860' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FAD485'; e.currentTarget.style.background = 'rgba(250,212,133,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B6860'; e.currentTarget.style.background = 'transparent'; }}
        >
          <Bell className="w-[17px] h-[17px]" />
        </button>

        <div style={{ width: '1px', height: '20px', background: 'rgba(250,212,133,0.1)' }} />

        {/* User Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white leading-none">{user?.name || 'Usuário'}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#4A4840' }}>{user?.email || ''}</p>
          </div>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
            style={{ background: 'linear-gradient(135deg, #FAD485, #F5C842)', color: '#000' }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'W'}
          </div>
        </div>
      </div>
    </header>
  );
}
