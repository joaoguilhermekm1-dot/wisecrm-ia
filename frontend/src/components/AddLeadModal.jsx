import React, { useState } from 'react';
import { X, User, Mail, Phone, Tag, MapPin } from 'lucide-react';

const SOURCES = ['Meta Ads', 'Google Ads', 'WhatsApp', 'Instagram', 'Indicação', 'Orgânico', 'Outro'];

export default function AddLeadModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: '', notes: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await onAdd({ ...form, status: 'NEW' });
      setForm({ name: '', email: '', phone: '', source: '', notes: '' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.15)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(250,212,133,0.08)' }}>
          <div>
            <h2 className="text-base font-black text-white">Novo Lead</h2>
            <p className="text-xs mt-0.5" style={{ color: '#6B6860' }}>Adicione um contato ao pipeline</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl transition-all"
            style={{ color: '#6B6860' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#FAD485'; e.currentTarget.style.background = 'rgba(250,212,133,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6B6860'; e.currentTarget.style.background = 'transparent'; }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Nome */}
          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#9B9589' }}>
              <User className="w-3 h-3" /> Nome *
            </label>
            <input
              required
              type="text"
              placeholder="Ex: João Silva"
              className="input-field"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#9B9589' }}>
              <Mail className="w-3 h-3" /> E-mail
            </label>
            <input
              type="email"
              placeholder="email@exemplo.com"
              className="input-field"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#9B9589' }}>
              <Phone className="w-3 h-3" /> WhatsApp / Telefone
            </label>
            <input
              type="tel"
              placeholder="(11) 99999-0000"
              className="input-field"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            />
          </div>

          {/* Source */}
          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#9B9589' }}>
              <MapPin className="w-3 h-3" /> Origem
            </label>
            <select
              className="input-field"
              value={form.source}
              onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
              style={{ appearance: 'none' }}
            >
              <option value="">Selecione a origem...</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#9B9589' }}>
              <Tag className="w-3 h-3" /> Observações
            </label>
            <textarea
              rows={3}
              placeholder="Contexto, necessidade do cliente..."
              className="input-field resize-none"
              style={{ lineHeight: '1.6' }}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <div className="wise-spinner w-4 h-4" /> : 'Adicionar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
