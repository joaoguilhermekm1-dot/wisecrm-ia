import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow, addEdge, useNodesState, useEdgesState,
  Controls, Background, MiniMap, Panel, Handle, Position, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Plus, Trash2, Sparkles, Save, Play, Loader2, ChevronDown,
  Workflow, Edit3, X, Check, Copy, Zap
} from 'lucide-react';
import { processesApi, leadsApi } from '../services/api';

const TYPE_CONFIG = {
  START:      { color: '#FAD485', label: 'Início',          emoji: '🚀' },
  CONTACT:    { color: '#A5B4FC', label: 'Contato',         emoji: '📞' },
  QUALIFY:    { color: '#FAD485', label: 'Qualificação',    emoji: '🔍' },
  PROPOSAL:   { color: '#C4B5FD', label: 'Proposta',        emoji: '📋' },
  FOLLOWUP:   { color: '#93C5FD', label: 'Follow-up',       emoji: '🔄' },
  CLOSE:      { color: '#86EFAC', label: 'Ganho',           emoji: '✅' },
  LOST:       { color: '#FCA5A5', label: 'Perdido',         emoji: '❌' },
  AI_ANALYZE: { color: '#FAD485', label: 'IA Analisa',      emoji: '🧠' },
  WHATSAPP:   { color: '#86EFAC', label: 'WhatsApp',        emoji: '💬' },
  WAIT:       { color: '#9B9589', label: 'Aguardar',        emoji: '⏳' },
  CUSTOM:     { color: '#FB923C', label: 'Personalizado',   emoji: '⚡' },
};

// ── WiseNode ────────────────────────────────────────────────────────────────
function WiseNode({ id, data, selected }) {
  const cfg = TYPE_CONFIG[data.type] || TYPE_CONFIG.CUSTOM;
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [labelVal, setLabelVal] = useState(data.label || cfg.label);
  const [descVal, setDescVal] = useState(data.description || '');
  const labelRef = useRef(null);
  const descRef = useRef(null);

  const saveLabel = () => {
    data.onUpdateLabel?.(id, labelVal, descVal);
    setEditingLabel(false);
    setEditingDesc(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveLabel();
    if (e.key === 'Escape') { setEditingLabel(false); setEditingDesc(false); setLabelVal(data.label || cfg.label); setDescVal(data.description || ''); }
  };

  return (
    <div
      className="group relative rounded-[2rem] transition-all duration-300"
      style={{
        background: 'rgba(10,10,7,0.92)',
        backdropFilter: 'blur(20px)',
        border: `1.5px solid ${selected ? cfg.color : 'rgba(255,255,255,0.07)'}`,
        minWidth: '220px',
        boxShadow: selected
          ? `0 20px 50px rgba(0,0,0,0.8), 0 0 30px ${cfg.color}30`
          : '0 10px 30px rgba(0,0,0,0.5)',
        padding: '18px 20px',
      }}
      onDoubleClick={() => { setEditingLabel(true); setTimeout(() => labelRef.current?.focus(), 50); }}
    >
      <Handle type="target" position={Position.Left}
        style={{ background: cfg.color, border: '3px solid #000', width: 12, height: 12, left: -6 }} />

      {/* Quick-add child button */}
      <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all z-20">
        <button
          onClick={(e) => { e.stopPropagation(); data.onAddChild?.(id, data.type); }}
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 transition-all"
        ><Plus className="w-4 h-4" /></button>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl"
          style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
          {cfg.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: `${cfg.color}AA` }}>
            {data.type}
          </p>
          {editingLabel ? (
            <div className="space-y-1.5">
              <input ref={labelRef} value={labelVal} onChange={e => setLabelVal(e.target.value)} onKeyDown={handleKeyDown}
                className="w-full bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-sm text-white outline-none"
                placeholder="Nome do nó..." />
              <input ref={descRef} value={descVal} onChange={e => setDescVal(e.target.value)} onKeyDown={handleKeyDown}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 outline-none"
                placeholder="Descrição..." />
              <div className="flex gap-1">
                <button onClick={saveLabel} className="flex-1 py-1 rounded-lg bg-[#FAD485] text-black text-[10px] font-black flex items-center justify-center gap-1">
                  <Check className="w-3 h-3" /> Salvar
                </button>
                <button onClick={() => { setEditingLabel(false); setLabelVal(data.label || cfg.label); setDescVal(data.description || ''); }}
                  className="p-1 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="text-[15px] font-black text-white leading-tight truncate">{data.label || cfg.label}</h4>
              <p className="text-[11px] text-[#9B9589] leading-relaxed mt-1 line-clamp-2">
                {data.description || 'Duplo-clique para editar'}
              </p>
            </>
          )}
        </div>
      </div>

      {selected && !editingLabel && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#0A0A07] border border-white/10 rounded-xl px-2 py-1.5 shadow-xl">
          <button onClick={() => { setEditingLabel(true); setTimeout(() => labelRef.current?.focus(), 50); }}
            className="p-1 rounded hover:bg-white/10 text-[#FAD485] transition-all" title="Editar">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => data.onDuplicate?.(id)}
            className="p-1 rounded hover:bg-white/10 text-[#A5B4FC] transition-all" title="Duplicar">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => data.onDelete?.(id)}
            className="p-1 rounded hover:bg-red-500/20 text-[#F87171] transition-all" title="Remover">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Right}
        style={{ background: cfg.color, border: '3px solid #000', width: 12, height: 12, right: -6 }} />
    </div>
  );
}

const nodeTypes = { wise: WiseNode };

const DEFAULT_NODES = [
  { id: '1', type: 'wise', position: { x: 50,  y: 200 }, data: { type: 'START',      label: 'Início do Fluxo',    description: 'Lead entra via anúncio ou WhatsApp' } },
  { id: '2', type: 'wise', position: { x: 340, y: 80  }, data: { type: 'CONTACT',    label: 'Primeiro Contato',   description: 'SDR inicia abordagem humanizada' } },
  { id: '3', type: 'wise', position: { x: 340, y: 320 }, data: { type: 'AI_ANALYZE', label: 'Análise Alanis',     description: 'IA perfila o DISC e sugere resposta' } },
  { id: '4', type: 'wise', position: { x: 630, y: 200 }, data: { type: 'QUALIFY',    label: 'Diagnóstico',        description: 'Call de diagnóstico ou formulário' } },
  { id: '5', type: 'wise', position: { x: 920, y: 80  }, data: { type: 'PROPOSAL',   label: 'Proposta Enviada',   description: 'Proposta ancorada no valor entregue' } },
  { id: '6', type: 'wise', position: { x: 920, y: 320 }, data: { type: 'FOLLOWUP',   label: 'Follow-up Ativo',   description: 'Régua de acompanhamento 7 dias' } },
  { id: '7', type: 'wise', position: { x: 1210, y: 80  }, data: { type: 'CLOSE',     label: 'Novo Cliente!',      description: 'Contrato assinado — Onboarding' } },
  { id: '8', type: 'wise', position: { x: 1210, y: 320 }, data: { type: 'LOST',      label: 'Perdido/Nurturing', description: 'Fluxo de reaquecimento ativado' } },
];

const mkEdge = (id, source, target, color = '#FAD485', animated = false) => ({
  id, source, target, animated,
  style: { stroke: color, strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color },
});

const DEFAULT_EDGES = [
  mkEdge('e1-2', '1', '2', '#FAD485', true),
  mkEdge('e1-3', '1', '3', '#FAD485', true),
  mkEdge('e2-4', '2', '4', '#A5B4FC'),
  mkEdge('e3-4', '3', '4', '#A5B4FC'),
  mkEdge('e4-5', '4', '5', '#C4B5FD'),
  mkEdge('e4-6', '4', '6', '#93C5FD'),
  mkEdge('e5-7', '5', '7', '#86EFAC'),
  mkEdge('e6-7', '6', '7', '#86EFAC'),
  mkEdge('e6-8', '6', '8', '#FCA5A5'),
];

const NODE_TYPES_LIST = Object.entries(TYPE_CONFIG).map(([type, cfg]) => ({ type, ...cfg }));

export default function MapView() {
  const [processes, setProcesses] = useState([]);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [newProcessName, setNewProcessName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const injectCallbacks = useCallback((nodeList) => {
    return nodeList.map(n => ({
      ...n,
      data: {
        ...n.data,
        onAddChild: handleAddChild,
        onUpdateLabel: handleUpdateLabel,
        onDuplicate: handleDuplicate,
        onDelete: handleDeleteNode,
      }
    }));
  }, []);

  useEffect(() => { loadProcesses(); }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        setNodes(ns => ns.filter(n => !n.selected));
        setEdges(es => es.filter(e => !e.selected));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const loadProcesses = async () => {
    try {
      const { data } = await processesApi.getAll();
      setProcesses(data);
      if (data.length > 0) selectProcess(data[0]);
      else { setNodes(injectCallbacks(DEFAULT_NODES)); setEdges(DEFAULT_EDGES); }
    } catch { setNodes(injectCallbacks(DEFAULT_NODES)); setEdges(DEFAULT_EDGES); }
    finally { setLoading(false); }
  };

  const handleAddChild = useCallback((parentId, parentType) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;
    const nextType = { START: 'CONTACT', CONTACT: 'QUALIFY', QUALIFY: 'PROPOSAL', PROPOSAL: 'FOLLOWUP', FOLLOWUP: 'CLOSE' }[parentType] || 'CONTACT';
    const cfg = TYPE_CONFIG[nextType];
    const id = Date.now().toString();
    const newNode = {
      id, type: 'wise',
      position: { x: parentNode.position.x + 300, y: parentNode.position.y + (Math.random() - 0.5) * 100 },
      data: { type: nextType, label: cfg.label, description: '', onAddChild: handleAddChild, onUpdateLabel: handleUpdateLabel, onDuplicate: handleDuplicate, onDelete: handleDeleteNode },
    };
    setNodes(ns => [...ns, newNode]);
    setEdges(es => [...es, mkEdge(`e${parentId}-${id}`, parentId, id, cfg.color, true)]);
  }, [nodes]);

  const handleUpdateLabel = useCallback((id, label, description) => {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, label, description } } : n));
  }, []);

  const handleDuplicate = useCallback((id) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    const newId = Date.now().toString();
    setNodes(ns => [...ns, {
      ...node, id: newId,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
      data: { ...node.data, label: node.data.label + ' (cópia)', onAddChild: handleAddChild, onUpdateLabel: handleUpdateLabel, onDuplicate: handleDuplicate, onDelete: handleDeleteNode }
    }]);
  }, [nodes]);

  const handleDeleteNode = useCallback((id) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.source !== id && e.target !== id));
  }, []);

  const selectProcess = useCallback((p) => {
    setCurrentProcess(p);
    const nodesWithCbs = (p.graphData?.nodes || []).map(n => ({
      ...n, data: { ...n.data, onAddChild: handleAddChild, onUpdateLabel: handleUpdateLabel, onDuplicate: handleDuplicate, onDelete: handleDeleteNode }
    }));
    setNodes(nodesWithCbs);
    setEdges(p.graphData?.edges || []);
  }, []);

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const cfg = TYPE_CONFIG[sourceNode?.data?.type] || TYPE_CONFIG.CONTACT;
    setEdges(es => addEdge({ ...params, animated: true, style: { stroke: cfg.color, strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: cfg.color } }, es));
  }, [nodes, setEdges]);

  const addNode = (type, customLabel) => {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.CUSTOM;
    const id = Date.now().toString();
    setNodes(ns => [...ns, {
      id, type: 'wise',
      position: { x: 150 + Math.random() * 300, y: 100 + Math.random() * 300 },
      data: { type, label: customLabel || cfg.label, description: '', onAddChild: handleAddChild, onUpdateLabel: handleUpdateLabel, onDuplicate: handleDuplicate, onDelete: handleDeleteNode },
    }]);
    setShowNodeMenu(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await processesApi.save({
        id: currentProcess?.id,
        name: currentProcess?.name || 'Mapa Comercial Wise',
        graphData: { nodes, edges }
      });
      setCurrentProcess(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadProcesses();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleNewProcess = async () => {
    if (!newProcessName.trim()) return;
    setCurrentProcess({ name: newProcessName.trim() });
    setNodes(injectCallbacks(DEFAULT_NODES));
    setEdges(DEFAULT_EDGES);
    setNewProcessName('');
    setShowNewInput(false);
    setShowDropdown(false);
  };

  const handleExecute = async () => {
    const sel = nodes.find(n => n.selected);
    if (!sel || !currentProcess) return;
    setExecuting(true);
    try {
      const { data: leads } = await leadsApi.getAll();
      if (!leads[0]) { alert('Crie um lead antes de testar.'); return; }
      const res = await processesApi.execute(currentProcess.id, sel.id, leads[0].id);
      alert(res.data.message || 'Ação disparada!');
    } catch (e) { console.error(e); }
    finally { setExecuting(false); }
  };

  if (loading && !nodes.length) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FAD485] animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] animate-fade-in space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3">
          {/* Process selector */}
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
              style={{ background: '#0A0A07', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(250,212,133,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            >
              <Workflow className="w-4 h-4 text-[#FAD485]" />
              <span className="max-w-[160px] truncate">{currentProcess?.name || 'Selecione um Mapa'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B6860]" />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl overflow-hidden z-50 shadow-2xl"
                style={{ background: '#0A0A07', border: '1px solid rgba(255,255,255,0.08)' }}>
                {processes.map(p => (
                  <button key={p.id} onClick={() => { selectProcess(p); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-[#E8E6DF] hover:bg-white/5 hover:text-[#FAD485] border-b border-white/5 transition-all flex items-center justify-between">
                    {p.name}
                    {currentProcess?.id === p.id && <div className="w-1.5 h-1.5 rounded-full bg-[#FAD485]" />}
                  </button>
                ))}
                {showNewInput ? (
                  <div className="p-3 space-y-2">
                    <input autoFocus value={newProcessName} onChange={e => setNewProcessName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNewProcess()}
                      placeholder="Nome do novo mapa..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FAD485]/40" />
                    <div className="flex gap-2">
                      <button onClick={handleNewProcess} className="flex-1 py-1.5 rounded-lg bg-[#FAD485] text-black text-[10px] font-black">Criar</button>
                      <button onClick={() => setShowNewInput(false)} className="px-3 rounded-lg text-[#6B6860] hover:text-white transition-all"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowNewInput(true)}
                    className="w-full text-left px-4 py-3 text-[10px] font-black text-[#FAD485] hover:bg-[#FAD485]/5 flex items-center gap-2 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Criar Novo Mapa
                  </button>
                )}
              </div>
            )}
          </div>

          <h1 className="text-xl font-black text-white tracking-tight uppercase italic hidden md:block">
            Flow Engine
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Node */}
          <div className="relative">
            <button onClick={() => setShowNodeMenu(!showNodeMenu)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#FAD485] text-xs font-black uppercase tracking-wider transition-all"
              style={{ background: 'rgba(250,212,133,0.06)', border: '1px solid rgba(250,212,133,0.15)' }}>
              <Plus className="w-3.5 h-3.5" /> Novo Nó
            </button>
            {showNodeMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50 shadow-2xl p-2"
                style={{ background: '#0A0A07', border: '1px solid rgba(255,255,255,0.08)' }}>
                {NODE_TYPES_LIST.map(nt => (
                  <button key={nt.type} onClick={() => addNode(nt.type)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-2.5 text-[#E8E6DF]"
                    onMouseEnter={e => { e.currentTarget.style.background = `${nt.color}15`; e.currentTarget.style.color = nt.color; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E8E6DF'; }}>
                    <span>{nt.emoji}</span> {nt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {nodes.some(n => n.selected) && (
            <button onClick={handleExecute} disabled={executing}
              className="px-4 py-2.5 rounded-xl text-[#FAD485] text-xs font-black uppercase flex items-center gap-2 transition-all"
              style={{ background: 'rgba(250,212,133,0.06)', border: '1px solid rgba(250,212,133,0.15)' }}>
              {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Executar
            </button>
          )}
          <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-xs px-5 py-2.5">
            <Save className="w-3.5 h-3.5" />
            {saved ? '✓ Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Tip */}
      <div className="shrink-0 flex items-center gap-2 text-[10px] text-[#6B6860] px-1">
        <Sparkles className="w-3 h-3 text-[#FAD485]" />
        Duplo-clique num nó para editar • Arraste as alças para conectar • Delete para remover selecionado
      </div>

      {/* Canvas */}
      <div className="flex-1 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(250,212,133,0.10)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: '#030301' }}
          defaultEdgeOptions={{ style: { stroke: 'rgba(250,212,133,0.3)', strokeWidth: 1.5 } }}
          onClick={() => setShowDropdown(false)}
        >
          <Background color="rgba(250,212,133,0.03)" gap={24} size={1} />
          <Controls style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.10)', borderRadius: '12px', overflow: 'hidden' }} />
          <MiniMap
            style={{ background: '#060604', border: '1px solid rgba(250,212,133,0.10)', borderRadius: '12px' }}
            nodeColor={n => {
              const cfg = TYPE_CONFIG[n.data?.type];
              return cfg ? cfg.color : '#9B9589';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
