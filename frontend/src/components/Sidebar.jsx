import React, { memo } from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Map as MapIcon,
  Settings,
  LogOut,
  Telescope,
  BarChart2,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../store/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',        path: '/' },
  { icon: Users,           label: 'Leads',             path: '/leads' },
  { icon: MessageSquare,   label: 'Conversas',         path: '/conversations' },
  { icon: BarChart2,       label: 'Marketing',         path: '/marketing' },
  { icon: Telescope,       label: 'Centro de Descoberta', path: '/discovery' },
  { icon: MapIcon,         label: 'Mapa Comercial',    path: '/map' },
];

export default memo(function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div style={{ background: '#060604', borderRight: '1px solid rgba(250,212,133,0.08)' }}
      className="w-60 h-screen flex flex-col shrink-0">

      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3">
        <img
          src="/wise-logo.jpg"
          alt="Wise CRM"
          className="shrink-0 rounded-xl"
          style={{ width: '38px', height: '38px', objectFit: 'cover' }}
        />
        <div>
          <h1 className="text-sm font-black text-white tracking-tight leading-none">WISE CRM</h1>
          <p style={{ color: '#FAD485', fontSize: '9px', letterSpacing: '0.18em' }} className="font-bold uppercase mt-0.5">Intelligence</p>
        </div>
      </div>

      <hr style={{ borderColor: 'rgba(250,212,133,0.07)' }} className="mx-4 mb-3" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm group',
                isActive
                  ? 'font-semibold'
                  : 'text-[#6B6860] hover:text-[#E8E6DF]'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(250,212,133,0.12) 0%, rgba(250,212,133,0.05) 100%)',
                color: '#FAD485',
                borderLeft: '2px solid #FAD485',
                paddingLeft: '10px',
              } : {}}
            >
              <item.icon
                style={isActive ? { color: '#FAD485' } : {}}
                className={clsx('w-[17px] h-[17px] shrink-0 transition-colors', !isActive && 'group-hover:text-[#E8E6DF]')}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: '#FAD485', boxShadow: '0 0 6px rgba(250,212,133,0.7)' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(250,212,133,0.07)' }}>
        {user && (
          <div className="px-3 py-2 mb-2 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
              style={{ background: 'linear-gradient(135deg, #FAD485, #F5C842)', color: '#000' }}>
              {user.name?.charAt(0) || 'W'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name || 'Usuário'}</p>
              <p className="text-[10px] truncate" style={{ color: '#4A4840' }}>{user.email || ''}</p>
            </div>
          </div>
        )}

        <Link to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#6B6860] hover:text-[#E8E6DF] hover:bg-white/5 transition-all text-sm">
          <Settings className="w-4 h-4" />
          Configurações
        </Link>

        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm"
          style={{ color: 'rgba(239,68,68,0.6)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgb(252,165,165)'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
})
