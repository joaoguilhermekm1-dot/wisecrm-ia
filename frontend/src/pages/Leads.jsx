import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import {
  Plus, Search, Mail, Phone, Trash2, Thermometer, MessageSquare,
  LayoutGrid, List, ChevronDown, Edit3, Save, X, Flame, TrendingUp,
  AlertCircle, Sparkles, Target, User, Tag, Calendar, ExternalLink, RefreshCcw,
  Lightbulb, MessageCircle, CheckCircle2, Info, ArrowRight
} from 'lucide-react';
import { leadsApi, pipelinesApi } from '../services/api';
import AddLeadModal from '../components/AddLeadModal';
import { socket, connectSocket } from '../services/socket';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ── Toast System ──────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    className="fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl backdrop-blur-md border"
    style={{ 
      background: type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
      borderColor: type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
      color: type === 'error' ? '#FCA5A5' : '#86EFAC'
    }}
  >
    {type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
    <span className="text-sm font-bold">{msg}</span>
  </motion.div>
);

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

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

// ── STAGE STYLES — Funil Wise Completo ────────────────────────────────────
// Normalizamos a chave para evitar erros de acentuação no mapeamento de cores
const normalizeStageKey = (s) => (s || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");

const STAGE_STYLES = {
  'NOVO':              { color: '#FAD485', emoji: '\ud83c\udf31', bg: 'rgba(250,212,133,0.06)' },
  'PROSPECCAO':        { color: '#60A5FA', emoji: '\ud83d\udd0e', bg: 'rgba(96,165,250,0.06)' },
  'DIAGNOSTICO':       { color: '#A78BFA', emoji: '\ud83e\ude7a', bg: 'rgba(167,139,250,0.06)' },
  'DIAGNDIAGNOSTICO':  { color: '#A78BFA', emoji: '\ud83e\ude7a', bg: 'rgba(167,139,250,0.06)' },
  'FECHAMENTO':        { color: '#FB923C', emoji: '\ud83e\udd1d', bg: 'rgba(251,146,60,0.06)' },
  'FECHADO':           { color: '#34D399', emoji: '\u2705', bg: 'rgba(52,211,153,0.06)' },
  'FOLOWUP':           { color: '#2DD4BF', emoji: '🔄', bg: 'rgba(45,212,191,0.06)' },
  'DEFAULT':           { color: '#9B9589', emoji: '\ud83d\udccc', bg: 'rgba(155,149,137,0.06)' },
};
const getStageStyle = (id) => STAGE_STYLES[normalizeStageKey(id)] || STAGE_STYLES.DEFAULT;

// ── Delete Stage Confirm Modal ─────────────────────────────────────────────
function DeleteStageModal({ stageName, leadCount, onConfirm, onCancel }) {
  if (!stageName) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm rounded-[2rem] animate-scale-up"
        style={{ background: '#0A0A07', border: '1px solid rgba(248,113,113,0.20)', boxShadow: '0 40px 100px rgba(0,0,0,0.95)' }}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)' }}>
            <Trash2 className="w-7 h-7" style={{ color: '#F87171' }} />
          </div>
          <h3 className="text-lg font-black text-white mb-2">Remover Etapa</h3>
          <p className="text-sm mb-1" style={{ color: '#9B9589' }}>Tem certeza que deseja excluir</p>
          <p className="text-base font-black mb-2" style={{ color: '#FAD485' }}>"{ stageName}"?</p>
          {leadCount > 0 && (
            <div className="px-4 py-3 rounded-xl mb-4 text-xs" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.20)', color: '#FB923C' }}>
              ⚠️ {leadCount} lead{leadCount > 1 ? 's serão movidos' : ' será movido'} para a primeira etapa disponível.
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <button onClick={onCancel} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={onConfirm}
              className="flex-1 text-sm px-4 py-2.5 rounded-xl font-black transition-all"
              style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
              Excluir Etapa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LEAD CARD (Kanban) ─────────────────────────────────────────────────────
const LeadCard = memo(({ lead, index, columnColor, onDelete, onClick, onDragUpdate, onDragStart, onDragEnd, boardRef }) => {
  const color = columnColor || '#FAD485';
  const temp = lead.temperature || 0;
  const prob = lead.probability || 0;
  const tempColor = temp >= 70 ? '#EF4444' : temp >= 40 ? '#F59E0B' : '#3B82F6';

  const lastUpdate = new Date(lead.updatedAt || lead.createdAt);
  const diffDays = Math.ceil(Math.abs(new Date() - lastUpdate) / (1000 * 60 * 60 * 24));
  const isStale = diffDays > 3;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateZ = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });

  return (
    <motion.div
      layout="position"
      layoutId={lead.id}
      drag
      dragConstraints={boardRef}
      dragElastic={0.1}
      dragTransition={{ power: 0.1, timeConstant: 200 }}
      style={{ x, y, rotateZ }}
      onDragStart={() => {
        rotateZ.set(Math.random() * 4 - 2);
        onDragStart?.();
        document.body.style.cursor = 'grabbing';
      }}
      onDrag={(e, info) => {
        onDragUpdate?.(info.point.x);
      }}
      onDragEnd={(event, info) => {
        rotateZ.set(0);
        document.body.style.cursor = 'auto';
        x.set(0);
        y.set(0);
        onClick({ ...lead, dropX: info.point.x, dropY: info.point.y, isDrop: true });
        document.querySelectorAll('.column-active').forEach(el => el.classList.remove('column-active'));
        onDragEnd?.();
      }}
      whileDrag={{ 
        scale: 1.05, 
        rotateZ: 0,
        zIndex: 99999,
        boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8)",
      }}
      className={`relative w-full min-w-[280px] rounded-2xl mb-3 cursor-grab active:cursor-grabbing will-change-transform group`}
    >
      <div className="absolute inset-0 bg-white/5 border border-dashed border-white/10 rounded-2xl pointer-events-none opacity-0 group-active:opacity-100 transition-opacity" />
      <div className="p-4 rounded-2xl relative overflow-hidden w-full min-w-0"
        style={{
          background: isStale ? '#121210' : '#0D0D0B',
          border: `1px solid ${isStale ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          opacity: 1,
        }}
      >
          {isStale && (
            <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[8px] font-black text-red-400 uppercase tracking-tighter shadow-lg backdrop-blur-md">
              <AlertCircle className="w-2.5 h-2.5" /> Estagnado {diffDays}d
            </div>
          )}

          <div className="absolute top-0 left-0 w-[4px] h-full rounded-l-xl" style={{ background: color, opacity: isStale ? 0.3 : 1 }} />

          <div className="flex items-start justify-between mb-3 pl-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                style={{ background: 'rgba(255,255,255,0.03)', color, border: `1px solid ${color}20` }}>
                {(lead.name || 'L').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white tracking-tight truncate">{lead.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#6B6860' }}>{lead.source || 'manual'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(lead); }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-[#444] transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 pl-2">
            {lead.phone && (
              <div className="flex items-center gap-2 text-[11px]" style={{ color: '#9B9589' }}>
                <Phone className="w-3 h-3 opacity-40 shrink-0" />{lead.phone}
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-[11px] truncate" style={{ color: '#6B6860' }}>
                <Mail className="w-3 h-3 opacity-40 shrink-0" />{lead.email}
              </div>
            )}
          </div>

          {temp > 0 && (
            <div className="mt-4 pl-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5" style={{ color: tempColor }}>
                  {temp >= 70 ? <Flame className="w-3 h-3 animate-pulse" /> : <Thermometer className="w-3 h-3" />}
                  <span className="text-[9px] font-black uppercase tracking-wider">{temp}%</span>
                </div>
                {prob > 0 && <span className="text-[9px] font-black" style={{ color: '#86EFAC' }}>{prob}% Prob.</span>}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${temp}%`, background: tempColor }} />
              </div>
            </div>
          )}
      </div>
    </motion.div>
  );
});

// ── KANBAN COLUMN ─────────────────────────────────────────────────────────
const KanbanColumn = memo(({ stageId, index, leads, onDelete, onClick, onRename, onDeleteStageRequest, isOver, onDragUpdate, onDragStart, onDragEnd, boardRef, isDraggingGlobal, isSourceColumn }) => {
  const style = getStageStyle(stageId);
  const color = style.color;
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(stageId);

  const handleRename = () => {
    if (nameInput.trim() && nameInput !== stageId) {
      onRename(stageId, nameInput.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div 
      id={`col-${stageId}`}
      className={`w-80 min-w-[320px] shrink-0 flex flex-col rounded-[2.5rem] bg-[#080806] border border-white/5 transition-all duration-500 will-change-transform`}
      style={{
        '--glow-color': color,
        position: 'relative',
        zIndex: isDraggingGlobal ? (isSourceColumn ? 10000 : 50) : 1
      }}
    >
      <style>{`
        .column-active {
          transform: scale(1.01);
          border-color: var(--glow-color) !important;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8), 0 0 40px var(--glow-color) !important;
        }
      `}</style>
      <div 
        className="px-6 py-5 flex items-center justify-between border-b border-white/5"
        style={{ borderBottomColor: `${color}15` }}
      >
        <div className="flex-1 min-w-0 pr-2">
          {isRenaming ? (
            <input
              autoFocus
              className="bg-black/60 border border-[#FAD485]/30 rounded-lg px-2 py-1 text-xs text-white w-full outline-none"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
            />
          ) : (
            <div className="flex items-center gap-2 group">
               <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}80` }} />
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] truncate" style={{ color }}>{stageId}</h3>
               <button onClick={() => setIsRenaming(true)} className="opacity-0 group-hover:opacity-100 p-1 text-[#4A4840] hover:text-[#FAD485] transition-all">
                  <Edit3 className="w-3 h-3" />
               </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg"
            style={{ background: `${color}10`, color, border: `1px solid ${color}15` }}>
            {leads.length}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); onDeleteStageRequest(stageId, leads.length); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#333] hover:text-red-400 transition-all"
            title="Excluir etapa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className={`flex-1 p-4 scrollbar-premium min-h-[300px] flex flex-col items-center ${isDraggingGlobal ? 'overflow-visible' : 'overflow-y-auto'}`}
        style={{ 
          background: 'transparent',
          transition: 'background-color 0.2s',
          zIndex: 1,
          overflowX: 'visible'
        }}
      >
        <AnimatePresence mode="sync" initial={false}>
          {leads.map((lead, idx) => (
            <LeadCard
              key={lead.id}
              index={idx}
              lead={lead}
              columnColor={color}
              onDelete={onDelete}
              onClick={onClick}
              onDragUpdate={onDragUpdate}
              onDragStart={() => onDragStart(stageId)}
              onDragEnd={onDragEnd}
              boardRef={boardRef}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function Leads() {
  const { toast, show: showToast } = useToast();
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
  const [stageToDelete, setStageToDelete] = useState(null); // { name, leadCount }
  const [isDragging, setIsDragging] = useState(false);
  const [activeStageId, setActiveStageId] = useState(null);
  const pipelineBoardRef = useRef(null);
  const navigate = useNavigate();
  const colPositions = useRef([]);

  const handleLeadDrop = useCallback(async (lead, x, y) => {
    if (!pipelineBoardRef.current || colPositions.current.length === 0) return;
    
    const board = pipelineBoardRef.current;
    const scrollX = board.scrollLeft;
    const absoluteX = x + scrollX;
    
    let closestIdx = 0;
    let minDiff = Infinity;
    colPositions.current.forEach((pos, i) => {
      const diff = Math.abs(pos.center - absoluteX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    const targetStage = stages[closestIdx];
    if (targetStage && lead.status !== targetStage) {
      const originalLeads = [...leads];
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: targetStage } : l));
      try { await leadsApi.update(lead.id, { status: targetStage }); } 
      catch { setLeads(originalLeads); }
    }
    // Limpamos as posições apenas após o drop ser processado
    colPositions.current = [];
  }, [stages, leads]);

  // Cache de coordenadas para evitar recálculo no drag
  const boardMetrics = useRef({ left: 0, scroll: 0 });

  const handleDragStart = useCallback((stageId) => {
    setIsDragging(true);
    setActiveStageId(stageId);
    
    if (pipelineBoardRef.current) {
      const board = pipelineBoardRef.current;
      const boardRect = board.getBoundingClientRect();
      const scrollX = board.scrollLeft;
      
      // Captura posições reais de todas as colunas
      const cols = board.querySelectorAll('[id^="col-"]');
      colPositions.current = Array.from(cols).map(col => {
        const rect = col.getBoundingClientRect();
        return {
          id: col.id.replace('col-', ''),
          center: rect.left + rect.width / 2 + scrollX
        };
      });

      boardMetrics.current = { left: boardRect.left, scroll: scrollX };
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setActiveStageId(null);
    // colPositions.current NÃO deve ser limpo aqui, para permitir que handleLeadDrop o use
  }, []);

  const handleDragUpdate = useCallback((x) => {
    if (colPositions.current.length === 0) return;
    const { scroll } = boardMetrics.current;
    const absoluteX = x + scroll;
    
    let closestIdx = 0;
    let minDiff = Infinity;
    colPositions.current.forEach((pos, i) => {
      const diff = Math.abs(pos.center - absoluteX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    const targetStage = stages[closestIdx];
    
    // Turbo Optimization: Atualiza CSS Variable diretamente no DOM
    stages.forEach((s, i) => {
      const col = document.getElementById(`col-${s}`);
      if (col) {
        if (i === closestIdx) {
          col.classList.add('column-active');
        } else {
          col.classList.remove('column-active');
        }
      }
    });
  }, [stages]);

  const fetchLeads = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [leadsRes, pipeRes] = await Promise.all([
        leadsApi.getAll(),
        pipelinesApi.get()
      ]);
      setLeads(leadsRes.data);

      let stagesData = pipeRes.data.stages || [];
      
      // Robustez: Garantir que seja array
      if (typeof stagesData === 'string') {
        try {
          stagesData = JSON.parse(stagesData);
        } catch (e) {
          stagesData = [];
        }
      }

      // Auto-repair: se o pipeline tem menos de 3 etapas ou não é array, restaurar o padrão
      if (!Array.isArray(stagesData) || stagesData.length < 3) {
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
    let isMounted = true;
    const init = async () => {
      if (isMounted) await fetchLeads();
    };
    init();
    connectSocket();
    socket.on('lead:update', (updatedLead) => {
      setLeads(prev => {
        const idx = prev.findIndex(l => l.id === updatedLead.id);
        if (idx !== -1) { const n = [...prev]; n[idx] = updatedLead; return n; }
        return [updatedLead, ...prev];
      });
    });
    socket.on('message:new', () => {
      if (isMounted) fetchLeads(false);
    });
    return () => { 
      isMounted = false;
      socket.off('lead:update'); 
      socket.off('message:new'); 
    };
  }, [fetchLeads]);

  // Reorder stages — pessimistic update
  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // 1. Reordenar Colunas (Etapas)
    if (type === 'column') {
      const newStages = Array.from(stages);
      const [removed] = newStages.splice(source.index, 1);
      newStages.splice(destination.index, 0, removed);

      setStages(newStages);
      try {
        await pipelinesApi.reorderStages(newStages);
      } catch {
        fetchLeads(false);
      }
      return;
    }

    // 2. Mover Cards (Leads)
    const startStage = source.droppableId;
    const finishStage = destination.droppableId;
    const leadId = draggableId;

    if (startStage === finishStage) {
      // Reordenação dentro da mesma coluna (Apenas Visual por enquanto, ou persistir se quiser)
      return;
    }

    // Mover entre colunas
    const originalLeads = [...leads];
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: finishStage } : l));
    
    try {
      await leadsApi.update(leadId, { status: finishStage });
    } catch {
      setLeads(originalLeads);
    }
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
        // Fallback para a primeira etapa se não houver match
        const firstStage = Array.isArray(stages) ? stages[0] : null;
        if (firstStage) grouped[firstStage].push(lead);
      }
    });
    return grouped;
  }, [filteredLeads, stages]);

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    const name = newStageName.trim().toUpperCase();
    try {
      await pipelinesApi.addStage(name);
      setStages(prev => [...prev, name]);
      setNewStageName('');
      setIsAddingStage(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao criar etapa');
    }
  };

  const handleRenameStage = async (oldName, newName) => {
    try {
      await pipelinesApi.renameStage(oldName, newName);
      setStages(prev => prev.map(s => s === oldName ? newName : s));
      setLeads(prev => prev.map(l => l.status === oldName ? { ...l, status: newName } : l));
    } catch (err) {
      alert('Erro ao renomear');
    }
  };

  const handleDeleteStageRequest = useCallback((name, leadCount) => {
    setStageToDelete({ name, leadCount });
  }, []);

  const handleDeleteStage = async () => {
    if (!stageToDelete) return;
    const name = stageToDelete.name;
    setStageToDelete(null);
    try {
      await pipelinesApi.deleteStage(name);
      setStages(prev => prev.filter(s => s !== name));
      fetchLeads(false);
    } catch (err) {
      console.error('Erro ao excluir etapa', err);
    }
  };

  return (
    <div className="h-[calc(100vh-88px)] flex flex-col space-y-5 animate-fade-in relative">
      {/* Toast Overlay */}
      {toast && (
        <div className={`fixed top-24 right-8 z-[10000] animate-fade-in px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 max-w-sm ${
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
          <button onClick={async () => {
            if(window.confirm('Isto redefinirá as colunas para o padrão (NOVO, PROSPECÇÃO, DIAGNÓSTICO, FECHAMENTO, FECHADO, FOLLOW-UP). Continuar?')) {
              try {
                await pipelinesApi.reset();
                window.location.reload();
              } catch (e) {
                alert('Erro ao resetar pipeline');
              }
            }
          }} className="btn-secondary py-2.5 px-3 text-sm flex items-center gap-2" title="Resetar Funil">
            <RefreshCcw className="w-4 h-4" />
          </button>
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
        <div
          ref={pipelineBoardRef}
          className="flex-1 flex gap-5 overflow-x-auto pb-8 pt-1 px-1 scrollbar-premium"
        >
          {stages.map((stageId, index) => (
            <KanbanColumn
              key={stageId}
              index={index}
              stageId={stageId}
              leads={leadsByStage[stageId] || []}
              onDelete={handleDelete}
              onClick={(lead) => {
                if (lead.isDrop) {
                  // Delay para garantir que a animação de arraste terminou antes de remontar
                  setTimeout(() => handleLeadDrop(lead, lead.dropX, lead.dropY), 10);
                } else {
                  setSelectedLead(lead);
                }
              }}
              onDragUpdate={handleDragUpdate}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              boardRef={pipelineBoardRef}
              isDraggingGlobal={isDragging}
              isSourceColumn={activeStageId === stageId}
              onRename={handleRenameStage}
              onDeleteStage={handleDeleteStage}
              onDeleteStageRequest={handleDeleteStageRequest}
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
                className="w-full py-16 rounded-[2rem] border-2 border-dashed border-white/5 hover:border-[#FAD485]/20 transition-all group flex flex-col items-center justify-center gap-4 opacity-30 hover:opacity-100"
                style={{ background: 'rgba(255,255,255,0.02)' }}
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
      <DeleteStageModal
        stageName={stageToDelete?.name}
        leadCount={stageToDelete?.leadCount || 0}
        onConfirm={handleDeleteStage}
        onCancel={() => setStageToDelete(null)}
      />
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
