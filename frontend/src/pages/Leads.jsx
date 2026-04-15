import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import {
  Plus, Search, Mail, Phone, Trash2, Thermometer, MessageSquare,
  LayoutGrid, List, ChevronDown, Edit3, Save, X, Flame, TrendingUp,
  AlertCircle, Sparkles, Target, User, Tag, Calendar, ExternalLink
} from 'lucide-react';
import { leadsApi, pipelinesApi } from '../services/api';
import AddLeadModal from '../components/AddLeadModal';
import { socket, connectSocket } from '../services/socket';
import { useNavigate } from 'react-router-dom';

// ── Temperature Badge ──────────────────────────────────────────────────────
function TempBadge({ temp }) {
  const t = temp || 0;
  const color = t >= 70 ? '#EF4444' : t >= 40 ? '#F59E0B' : '#3B82F6';
  const label = t >= 70 ? 'Quente' : t >= 40 ? 'Morno' : 'Frio';
  const Icon = t >= 70 ? Flame : Thermometer;
  return (
    <div className="flex items-center gap-1" style={{ color }}>
      <Icon className="w-3 h-3" />
      <span className="text-[10px] font-black uppercase tracking-wider">{label} {t}%</span>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteConfirmModal({ lead, onConfirm, onCancel }) {
  if (!lead) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm rounded-2xl animate-fade-in"
        style={{ background: '#0A0A07', border: '1px solid rgba(239,68,68,0.20)', boxShadow: '0 32px 80px rgba(0,0,0,0.9)' }}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}>
            <Trash2 className="w-5 h-5" style={{ color: '#FCA5A5' }} />
          </div>
          <h3 className="text-base font-black text-white mb-2">Remover Lead</h3>
          <p className="text-sm mb-1" style={{ color: '#9B9589' }}>Tem certeza que deseja remover</p>
          <p className="text-sm font-bold mb-6" style={{ color: '#FAD485' }}>"{lead.name}"?</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={onConfirm}
              className="flex-1 text-sm px-4 py-2 rounded-xl font-bold transition-all"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}>
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Full Lead Details / Edit Modal ─────────────────────────────────────────
function LeadDetailsModal({ lead, onClose, onUpdate, onOpenChat }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
        notes: lead.notes || '',
      });
      setEditing(false);
    }
  }, [lead?.id]);

  if (!lead) return null;

  const meta = lead.metadata || {};
  const temp = lead.temperature || 0;
  const prob = lead.probability || 0;
  const tempColor = temp >= 70 ? '#EF4444' : temp >= 40 ? '#F59E0B' : '#3B82F6';

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await leadsApi.update(lead.id, form);
      onUpdate(updated.data);
      setEditing(false);
    } catch (err) {
      console.error('Erro ao salvar lead', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-2xl animate-fade-in flex flex-col max-h-[92vh]"
        style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.15)', boxShadow: '0 40px 100px rgba(0,0,0,0.95)' }}>

        {/* Header */}
        <div className="p-6 border-b flex items-start gap-4" style={{ borderColor: 'rgba(250,212,133,0.08)' }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shrink-0 relative"
            style={{ background: `${tempColor}12`, color: tempColor, border: `1px solid ${tempColor}20` }}>
            {(lead.name || 'L').charAt(0).toUpperCase()}
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black"
              style={{ background: tempColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white truncate">{lead.name}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <TempBadge temp={temp} />
              {prob > 0 && (
                <div className="flex items-center gap-1" style={{ color: '#86EFAC' }}>
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{prob}% Probabilidade</span>
                </div>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(250,212,133,0.08)', color: '#FAD485', border: '1px solid rgba(250,212,133,0.15)' }}>
                {lead.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="p-2 rounded-xl hover:bg-white/5 transition-all"
                style={{ color: '#9B9589' }} title="Editar lead">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 transition-all"
              style={{ color: '#6B6860' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Temperature Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B6860' }}>
              Temperatura do Lead
            </span>
            <span className="text-[10px] font-black" style={{ color: tempColor }}>{temp}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${temp}%`,
                background: `linear-gradient(90deg, #3B82F6, #F59E0B ${Math.min(temp * 1.2, 70)}%, #EF4444)`
              }} />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {/* Inline edit form */}
          {editing ? (
            <div className="space-y-4">
              {[
                { label: 'Nome', key: 'name', icon: User, type: 'text' },
                { label: 'Email', key: 'email', icon: Mail, type: 'email' },
                { label: 'Telefone', key: 'phone', icon: Phone, type: 'tel' },
                { label: 'Origem', key: 'source', icon: Tag, type: 'text' },
              ].map(({ label, key, icon: Icon, type }) => (
                <div key={key}>
                  <label className="text-[10px] uppercase font-bold mb-1.5 flex items-center gap-1.5"
                    style={{ color: '#6B6860' }}>
                    <Icon className="w-3 h-3" /> {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                    style={{
                      background: '#060604',
                      border: '1px solid rgba(250,212,133,0.15)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(250,212,133,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(250,212,133,0.15)'}
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] uppercase font-bold mb-1.5 flex items-center gap-1.5"
                  style={{ color: '#6B6860' }}>
                  <Edit3 className="w-3 h-3" /> Notas Internas
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Anote observações sobre este lead..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none resize-none transition-all"
                  style={{
                    background: '#060604',
                    border: '1px solid rgba(250,212,133,0.15)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(250,212,133,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(250,212,133,0.15)'}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Contact Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Email', value: lead.email, icon: Mail },
                  { label: 'Telefone', value: lead.phone, icon: Phone },
                  { label: 'Origem', value: lead.source, icon: Tag },
                  { label: 'Criado em', value: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : null, icon: Calendar },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase font-bold mb-1 flex items-center gap-1.5" style={{ color: '#6B6860' }}>
                      <Icon className="w-3 h-3" /> {label}
                    </p>
                    <p className="text-sm text-white break-all">{value || <span style={{ color: '#4A4840' }}>Não informado</span>}</p>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(250,212,133,0.03)', border: '1px solid rgba(250,212,133,0.08)' }}>
                  <p className="text-[10px] uppercase font-bold mb-2" style={{ color: '#6B6860' }}>📝 Notas</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#9B9589' }}>{lead.notes}</p>
                </div>
              )}

              {/* Metadata */}
              {(meta.website || meta.address || meta.url) && (
                <div className="border-t pt-4 space-y-3" style={{ borderColor: 'rgba(250,212,133,0.06)' }}>
                  {meta.website && (
                    <div>
                      <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#6B6860' }}>Website</p>
                      <a href={meta.website} target="_blank" rel="noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 truncate">
                        <ExternalLink className="w-3 h-3 shrink-0" /> {meta.website}
                      </a>
                    </div>
                  )}
                  {meta.address && (
                    <div>
                      <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#6B6860' }}>Endereço</p>
                      <p className="text-sm text-white">{meta.address}</p>
                    </div>
                  )}
                  {meta.url && (
                    <a href={meta.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(250,212,133,0.06)', color: '#FAD485', border: '1px solid rgba(250,212,133,0.12)' }}>
                      📍 Abrir no Google Maps
                    </a>
                  )}
                </div>
              )}

              {/* AI Summary */}
              {lead.summary && (
                <div className="p-4 rounded-xl flex items-start gap-3"
                  style={{ background: 'rgba(250,212,133,0.03)', border: '1px solid rgba(250,212,133,0.10)' }}>
                  <Sparkles className="w-4 h-4 text-[#FAD485] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#FAD485' }}>Análise IA</p>
                    <p className="text-sm" style={{ color: '#9B9589' }}>{lead.summary}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'rgba(250,212,133,0.08)' }}>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="wise-spinner w-4 h-4" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onOpenChat(lead)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{ background: 'rgba(34,197,94,0.08)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.15)' }}>
                <MessageSquare className="w-4 h-4" /> Abrir Conversa
              </button>
              <button onClick={onClose} className="btn-secondary text-sm px-5">Fechar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── STAGE STYLES ──────────────────────────────────────────────────────────
const STAGE_STYLES = {
  'NEW':          { color: '#FAD485' },
  'NOVO':         { color: '#FAD485' },
  'DIAGNÓSTICO':  { color: '#A5B4FC' },
  'PROPOSTA':     { color: '#C4B5FD' },
  'FECHAMENTO':   { color: '#86EFAC' },
  'FECHADO':      { color: '#86EFAC' },
  'PERDIDO':      { color: '#FCA5A5' },
  'DEFAULT':      { color: '#9B9589' },
};
const getStageStyle = (id) => STAGE_STYLES[(id || '').toUpperCase()] || STAGE_STYLES.DEFAULT;

// ── LEAD CARD (Kanban) ─────────────────────────────────────────────────────
const LeadCard = memo(({ lead, stageId, columnColor, onDelete, onClick, onDragStart, onDragEnd }) => {
  const color = columnColor || '#FAD485';
  const [isDragging, setIsDragging] = useState(false);
  const temp = lead.temperature || 0;
  const prob = lead.probability || 0;
  const tempColor = temp >= 70 ? '#EF4444' : temp >= 40 ? '#F59E0B' : '#3B82F6';

  const handleDragStart = useCallback((e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ leadId: lead.id, fromStage: stageId }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(lead.id);
  }, [lead.id, stageId, onDragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd?.();
  }, [onDragEnd]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => { if (!isDragging) onClick(lead); }}
      className="relative rounded-xl p-4 mb-3 cursor-grab active:cursor-grabbing select-none"
      style={{
        background: isDragging ? '#141410' : '#0A0A07',
        border: `1px solid ${isDragging ? `${color}40` : 'rgba(255,255,255,0.05)'}`,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? `0 20px 40px rgba(0,0,0,0.6), 0 0 20px ${color}20` : 'none',
        transform: isDragging ? 'scale(1.01)' : 'scale(1)',
        transition: 'opacity 0.15s, border-color 0.15s, background-color 0.15s',
        willChange: 'transform',
      }}
    >
      {/* Lateral accent bar */}
      <div className="absolute top-0 left-0 w-[3px] h-full rounded-l-xl" style={{ background: color, opacity: 0.5 }} />

      <div className="flex items-start justify-between mb-3 pl-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
            style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}>
            {(lead.name || 'L').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white tracking-tight truncate">{lead.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#555' }}>{lead.source || 'manual'}</span>
            </div>
          </div>
        </div>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(lead); }}
          className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 text-[#333] transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 pl-2">
        {lead.phone && (
          <div className="flex items-center gap-2 text-[11px]" style={{ color: '#86EFAC90' }}>
            <Phone className="w-2.5 h-2.5 opacity-40" />{lead.phone}
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2 text-[11px] truncate" style={{ color: '#6B6860' }}>
            <Mail className="w-2.5 h-2.5 opacity-40 shrink-0" />{lead.email}
          </div>
        )}
      </div>

      {/* Temperature bar at bottom */}
      {temp > 0 && (
        <div className="mt-3 pl-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1" style={{ color: tempColor }}>
              {temp >= 70 ? <Flame className="w-2.5 h-2.5" /> : <Thermometer className="w-2.5 h-2.5" />}
              <span className="text-[9px] font-black uppercase tracking-wide">{temp}%</span>
            </div>
            {prob > 0 && (
              <span className="text-[9px] font-black" style={{ color: '#86EFAC80' }}>{prob}% conv.</span>
            )}
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full rounded-full"
              style={{
                width: `${temp}%`,
                background: `linear-gradient(90deg, #3B82F6, #F59E0B ${Math.min(temp * 1.3, 70)}%, #EF4444)`
              }} />
          </div>
        </div>
      )}
    </div>
  );
});

// ── KANBAN COLUMN ─────────────────────────────────────────────────────────
const KanbanColumn = memo(({ stageId, leads, onDelete, onClick, onDropLead }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const style = getStageStyle(stageId);
  const color = style.color;

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const { leadId, fromStage } = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (fromStage !== stageId) {
        onDropLead(leadId, stageId);
      }
    } catch {}
  }, [stageId, onDropLead]);

  return (
    <div
      className="w-80 shrink-0 flex flex-col rounded-3xl transition-all duration-200"
      style={{
        background: isDragOver ? `${color}08` : '#0A0A07',
        border: `2px solid ${isDragOver ? `${color}50` : 'rgba(255,255,255,0.04)'}`,
        boxShadow: isDragOver ? `0 0 30px ${color}15, inset 0 0 40px ${color}05` : 'none',
      }}
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5"
        style={{ borderBottomColor: `${color}10` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>{stageId}</h3>
        </div>
        <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
          style={{ background: `${color}15`, color, border: `1px solid ${color}20` }}>
          {leads.length}
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1 p-3 overflow-y-auto"
        style={{ minHeight: '200px' }}
      >
        {leads.length === 0 && isDragOver && (
          <div className="h-full min-h-[120px] rounded-xl border-2 border-dashed flex items-center justify-center"
            style={{ borderColor: `${color}30`, background: `${color}05` }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: `${color}80` }}>
              Soltar aqui
            </p>
          </div>
        )}
        {leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            stageId={stageId}
            columnColor={color}
            onDelete={onDelete}
            onClick={onClick}
            onDragStart={() => {}}
            onDragEnd={() => {}}
          />
        ))}
      </div>
    </div>
  );
});

// ── LIST VIEW ROW ─────────────────────────────────────────────────────────
function LeadRow({ lead, onDelete, onClick }) {
  const temp = lead.temperature || 0;
  const tempColor = temp >= 70 ? '#EF4444' : temp >= 40 ? '#F59E0B' : '#3B82F6';
  const stageStyle = getStageStyle(lead.status);

  return (
    <div
      onClick={() => onClick(lead)}
      className="flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all group"
      style={{ border: '1px solid rgba(255,255,255,0.04)', background: '#0A0A07' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(250,212,133,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
        style={{ background: `${stageStyle.color}12`, color: stageStyle.color }}>
        {(lead.name || 'L').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{lead.name}</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: '#6B6860' }}>
          {lead.email || lead.phone || 'Sem contato'}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0" style={{ color: '#6B6860' }}>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: `${stageStyle.color}10`, color: stageStyle.color, border: `1px solid ${stageStyle.color}20` }}>
          {lead.status}
        </span>
      </div>
      <div className="w-20 shrink-0">
        <TempBadge temp={temp} />
        <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="h-full rounded-full"
            style={{ width: `${temp}%`, background: `linear-gradient(90deg, #3B82F6, #F59E0B 70%, #EF4444)` }} />
        </div>
      </div>
      <p className="text-[11px] w-16 text-right shrink-0" style={{ color: '#4A4840' }}>
        {lead.source || '—'}
      </p>
      <button onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onDelete(lead); }}
        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 text-[#444] transition-all shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [newStageName, setNewStageName] = useState('');
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const navigate = useNavigate();

  const fetchLeads = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [leadsRes, pipeRes] = await Promise.all([
        leadsApi.getAll(),
        pipelinesApi.get()
      ]);
      setLeads(leadsRes.data);

      let stagesData = pipeRes.data.stages || [];

      // Auto-repair: se o pipeline tem menos de 3 etapas, restaurar o padrão
      if (stagesData.length < 3) {
        try {
          const resetRes = await pipelinesApi.reset();
          stagesData = resetRes.data.pipeline?.stages || stagesData;
        } catch (e) {
          console.warn('Pipeline reset falhou:', e.message);
        }
      }

      setStages(stagesData);

      const params = new URLSearchParams(window.location.search);
      const leadIdParam = params.get('leadId');
      if (leadIdParam) {
        const matching = leadsRes.data.find(l => l.id === leadIdParam);
        if (matching) setSelectedLead(matching);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    connectSocket();
    socket.on('lead:update', (updatedLead) => {
      setLeads(prev => {
        const idx = prev.findIndex(l => l.id === updatedLead.id);
        if (idx !== -1) { const n = [...prev]; n[idx] = updatedLead; return n; }
        return [updatedLead, ...prev];
      });
    });
    socket.on('message:new', () => fetchLeads(false));
    return () => { socket.off('lead:update'); socket.off('message:new'); };
  }, [fetchLeads]);

  // Drop handler — optimistic update
  const handleDropLead = useCallback(async (leadId, newStage) => {
    const original = [...leads];
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStage } : l));
    try {
      await leadsApi.update(leadId, { status: newStage });
    } catch {
      setLeads(original);
    }
  }, [leads]);

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    const updatedStages = [...stages, newStageName.trim().toUpperCase()];
    try {
      await pipelinesApi.updateStages(updatedStages);
      setStages(updatedStages);
      setNewStageName('');
      setIsAddingStage(false);
    } catch { alert('Erro ao criar etapa'); }
  };

  const handleAddLead = async (formData) => {
    try {
      await leadsApi.create(formData);
      fetchLeads(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao criar lead');
    }
  };

  const handleDelete = useCallback((lead) => setLeadToDelete(lead), []);
  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await leadsApi.delete(leadToDelete.id);
      setLeads(prev => prev.filter(l => l.id !== leadToDelete.id));
    } catch (err) { console.error(err); }
    finally { setLeadToDelete(null); }
  };

  const handleUpdateLead = useCallback((updated) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setSelectedLead(updated);
  }, []);

  const handleOpenChat = useCallback((lead) => {
    navigate('/conversations');
  }, [navigate]);

  const filteredLeads = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return leads.filter(l =>
      (l.name || '').toLowerCase().includes(q) ||
      (l.email && l.email.toLowerCase().includes(q)) ||
      (l.phone && l.phone.includes(searchTerm))
    );
  }, [leads, searchTerm]);

  // Stage variant mapping
  const leadsByStage = useMemo(() => {
    const grouped = {};
    stages.forEach(s => grouped[s] = []);

    filteredLeads.forEach(lead => {
      const s = (lead.status || '').toUpperCase().trim();
      const matched = stages.find(stageId => {
        const t = stageId.toUpperCase().trim();
        if (s === t) return true;
        const NEW_VARIANTS = ['NEW', 'NOVO', 'PENDENTE', 'UNCATEGORIZED', '', 'LEAD', 'INBOUND'];
        const DIAG_VARIANTS = ['DIAGNÓSTICO', 'DIAGNOSTICO', 'EM ANÁLISE', 'EM ANALISE', 'QUALIFICADO'];
        const PROPOSAL_VARIANTS = ['PROPOSTA', 'NEGOCIAÇÃO', 'NEGOCIACAO', 'OFERTA'];
        const CLOSED_VARIANTS = ['FECHAMENTO', 'FECHADO', 'WON', 'GANHO', 'ATIVO', 'CONVERTIDO'];
        const LOST_VARIANTS = ['PERDIDO', 'LOST', 'CANCELADO', 'DESQUALIFICADO'];
        if (NEW_VARIANTS.includes(t) && NEW_VARIANTS.includes(s)) return true;
        if (DIAG_VARIANTS.includes(t) && DIAG_VARIANTS.includes(s)) return true;
        if (PROPOSAL_VARIANTS.includes(t) && PROPOSAL_VARIANTS.includes(s)) return true;
        if (CLOSED_VARIANTS.includes(t) && CLOSED_VARIANTS.includes(s)) return true;
        if (LOST_VARIANTS.includes(t) && LOST_VARIANTS.includes(s)) return true;
        return false;
      });
      if (matched) {
        grouped[matched].push(lead);
      } else {
        if (stages.length > 0) grouped[stages[0]].push(lead);
      }
    });
    return grouped;
  }, [filteredLeads, stages]);

  return (
    <div className="h-[calc(100vh-88px)] flex flex-col space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 px-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Pipeline de Leads</h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FAD485] animate-pulse" />
              <span className="text-[10px] font-black text-[#FAD485] uppercase tracking-wider">{leads.length} Ativos</span>
            </div>
          </div>
          <p className="text-xs mt-1 text-[#6B6860] font-medium">Gestão comercial inteligente e fluida.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl gap-1" style={{ background: '#0A0A07', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className="p-2 rounded-lg transition-all"
              style={{ background: viewMode === 'kanban' ? 'rgba(250,212,133,0.12)' : 'transparent', color: viewMode === 'kanban' ? '#FAD485' : '#4A4840' }}
              title="Visão Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-lg transition-all"
              style={{ background: viewMode === 'list' ? 'rgba(250,212,133,0.12)' : 'transparent', color: viewMode === 'list' ? '#FAD485' : '#4A4840' }}
              title="Visão Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0A0A07] border border-white/5 focus-within:border-[#FAD485]/30 transition-all w-64">
            <Search className="w-4 h-4 text-[#4A4840]" />
            <input
              type="text"
              placeholder="Buscar por nome, email..."
              className="flex-1 bg-transparent border-none text-sm outline-none text-white placeholder:text-[#4A4840]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Lead
          </button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="wise-spinner" />
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex-1 flex gap-5 overflow-x-auto pb-8 pt-1 px-1 scrollbar-premium"
          onDragOver={e => e.preventDefault()}>
          {stages.map(stageId => (
            <KanbanColumn
              key={stageId}
              stageId={stageId}
              leads={leadsByStage[stageId] || []}
              onDelete={handleDelete}
              onClick={setSelectedLead}
              onDropLead={handleDropLead}
            />
          ))}

          {/* Add Stage Button */}
          <div className="w-72 shrink-0">
            {isAddingStage ? (
              <div className="rounded-3xl p-6 animate-fade-in border border-white/10" style={{ background: '#0A0A07' }}>
                <p className="text-[10px] font-black text-[#FAD485] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Plus className="w-3 h-3" /> Nova Etapa
                </p>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Pós-Venda..."
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white mb-4 outline-none focus:border-[#FAD485]/30 transition-all"
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddStage()}
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsAddingStage(false)} className="btn-secondary flex-1 text-xs">Cancelar</button>
                  <button onClick={handleAddStage} className="btn-primary flex-1 text-xs px-0">Salvar</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingStage(true)}
                className="w-full py-16 rounded-3xl border-2 border-dashed border-white/5 hover:border-[#FAD485]/20 transition-all group flex flex-col items-center justify-center gap-4 opacity-30 hover:opacity-100"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FAD485]/10 transition-all">
                  <Plus className="w-6 h-6 text-[#FAD485]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FAD485]">Nova Etapa</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-y-auto scrollbar-premium pr-1 space-y-2">
          {/* Header row */}
          <div className="flex items-center gap-4 px-5 py-2">
            <div className="w-10 shrink-0" />
            <div className="flex-1 text-[10px] font-black uppercase tracking-widest" style={{ color: '#4A4840' }}>Nome</div>
            <div className="w-28 shrink-0 text-[10px] font-black uppercase tracking-widest" style={{ color: '#4A4840' }}>Status</div>
            <div className="w-20 shrink-0 text-[10px] font-black uppercase tracking-widest" style={{ color: '#4A4840' }}>Temperatura</div>
            <div className="w-16 text-right shrink-0 text-[10px] font-black uppercase tracking-widest" style={{ color: '#4A4840' }}>Origem</div>
            <div className="w-9 shrink-0" />
          </div>

          {filteredLeads.length === 0 && (
            <div className="flex items-center justify-center py-20 opacity-30">
              <p className="text-sm" style={{ color: '#6B6860' }}>Nenhum lead encontrado.</p>
            </div>
          )}

          {filteredLeads.map(lead => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onDelete={handleDelete}
              onClick={setSelectedLead}
            />
          ))}
        </div>
      )}

      <DeleteConfirmModal lead={leadToDelete} onConfirm={confirmDelete} onCancel={() => setLeadToDelete(null)} />
      <AddLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddLead} />
      <LeadDetailsModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleUpdateLead}
        onOpenChat={handleOpenChat}
      />
    </div>
  );
}
