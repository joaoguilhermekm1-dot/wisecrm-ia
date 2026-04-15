import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2, Sparkles, Save, Play, Loader2, ChevronDown } from 'lucide-react';
import { processesApi, leadsApi } from '../services/api';

// Custom Node Component
function WiseNode({ data, selected }) {
  const typeConfig = {
    START:       { color: '#FAD485', bg: 'rgba(250,212,133,0.12)', label: '🚀 Início' },
    CONTACT:     { color: '#A5B4FC', bg: 'rgba(99,102,241,0.12)',  label: '📞 Contato' },
    QUALIFY:     { color: '#FAD485', bg: 'rgba(250,212,133,0.08)', label: '🔍 Qualificação' },
    PROPOSAL:    { color: '#C4B5FD', bg: 'rgba(139,92,246,0.12)', label: '📋 Proposta' },
    FOLLOWUP:    { color: '#93C5FD', bg: 'rgba(59,130,246,0.10)', label: '🔄 Follow-up' },
    CLOSE:       { color: '#86EFAC', bg: 'rgba(34,197,94,0.12)',  label: '✅ Fechamento' },
    LOST:        { color: '#FCA5A5', bg: 'rgba(239,68,68,0.12)',  label: '❌ Perdido' },
    AI_ANALYZE:  { color: '#FAD485', bg: 'rgba(250,212,133,0.08)', label: '🧠 IA Analisa' },
    WHATSAPP:    { color: '#86EFAC', bg: 'rgba(34,197,94,0.08)',  label: '💬 WhatsApp' },
    WAIT:        { color: '#9B9589', bg: 'rgba(155,149,137,0.10)', label: '⏳ Aguardar' },
  };
  const cfg = typeConfig[data.type] || typeConfig['CONTACT'];

  return (
    <div style={{
      background: cfg.bg,
      border: `1.5px solid ${selected ? cfg.color : cfg.color + '40'}`,
      borderRadius: '12px',
      padding: '12px 16px',
      minWidth: '160px',
      boxShadow: selected ? `0 0 20px ${cfg.color}30` : '0 4px 20px rgba(0,0,0,0.4)',
      transition: 'all 0.2s',
    }}>
      <div className="flex items-center gap-2">
        <div className="text-sm leading-none">{cfg.label.split(' ')[0]}</div>
        <div>
          <p className="text-xs font-black" style={{ color: cfg.color }}>
            {cfg.label.split(' ').slice(1).join(' ')}
          </p>
          {data.label && (
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{data.label}</p>
          )}
        </div>
      </div>
      {data.description && (
        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {data.description}
        </p>
      )}
    </div>
  );
}

const nodeTypes = { wise: WiseNode };

const DEFAULT_NODES = [
  { id: '1', type: 'wise', position: { x: 50,  y: 200 }, data: { type: 'START',      label: 'Lead Entra',     description: 'Novo lead captado pelo sistema' } },
  { id: '2', type: 'wise', position: { x: 280, y: 100 }, data: { type: 'CONTACT',    label: 'Primeiro Contato', description: 'WhatsApp / ligação em até 5 min' } },
  { id: '3', type: 'wise', position: { x: 280, y: 320 }, data: { type: 'AI_ANALYZE', label: 'IA Analisa Perfil', description: 'Score de qualificação automático' } },
  { id: '4', type: 'wise', position: { x: 520, y: 200 }, data: { type: 'QUALIFY',    label: 'Diagnóstico',    description: 'Entenda a dor real do cliente' } },
  { id: '5', type: 'wise', position: { x: 760, y: 100 }, data: { type: 'PROPOSAL',   label: 'Proposta',       description: 'Apresentação personalizada' } },
  { id: '6', type: 'wise', position: { x: 760, y: 320 }, data: { type: 'FOLLOWUP',   label: 'Follow-up IA',  description: 'Sequência automática 24/48/72h' } },
  { id: '7', type: 'wise', position: { x: 990, y: 100 }, data: { type: 'CLOSE',      label: 'Fechamento',     description: 'Contrato e onboarding' } },
  { id: '8', type: 'wise', position: { x: 990, y: 320 }, data: { type: 'LOST',       label: 'Lead Perdido',   description: 'Nurturing de longo prazo' } },
];

const DEFAULT_EDGES = [
  { id: 'e1-2', source: '1', target: '2', sourceHandle: null, targetHandle: null, animated: true, style: { stroke: '#FAD485', strokeWidth: 1.5, opacity: 0.6 } },
  { id: 'e1-3', source: '1', target: '3', sourceHandle: null, targetHandle: null, animated: true, style: { stroke: '#FAD485', strokeWidth: 1.5, opacity: 0.6 } },
  { id: 'e2-4', source: '2', target: '4', sourceHandle: null, targetHandle: null, style: { stroke: 'rgba(165,180,252,0.5)', strokeWidth: 1.5 } },
  { id: 'e3-4', source: '3', target: '4', sourceHandle: null, targetHandle: null, style: { stroke: 'rgba(165,180,252,0.5)', strokeWidth: 1.5 } },
  { id: 'e4-5', source: '4', target: '5', sourceHandle: null, targetHandle: null, style: { stroke: 'rgba(196,181,253,0.5)', strokeWidth: 1.5 } },
  { id: 'e4-6', source: '4', target: '6', sourceHandle: null, targetHandle: null, style: { stroke: 'rgba(147,197,253,0.5)', strokeWidth: 1.5 } },
  { id: 'e5-7', source: '5', target: '7', sourceHandle: null, targetHandle: null, style: { stroke: 'rgba(134,239,172,0.5)', strokeWidth: 1.5 } },
  { id: 'e6-7', source: '6', target: '7', sourceHandle: null, targetHandle: null, style: { stroke: 'rgba(134,239,172,0.5)', strokeWidth: 1.5 } },
  { id: 'e6-8', source: '6', target: '8', sourceHandle: null, targetHandle: null, style: { stroke: 'rgba(252,165,165,0.5)', strokeWidth: 1.5 } },
];

const NODE_TYPES_LIST = [
  { type: 'START',      label: 'Início',     color: '#FAD485' },
  { type: 'CONTACT',    label: 'Contato',    color: '#A5B4FC' },
  { type: 'QUALIFY',    label: 'Qualificação', color: '#FAD485' },
  { type: 'PROPOSAL',   label: 'Proposta',   color: '#C4B5FD' },
  { type: 'FOLLOWUP',   label: 'Follow-up',  color: '#93C5FD' },
  { type: 'CLOSE',      label: 'Fechamento', color: '#86EFAC' },
  { type: 'LOST',       label: 'Perdido',    color: '#FCA5A5' },
  { type: 'AI_ANALYZE', label: 'IA Analisa', color: '#FAD485' },
  { type: 'WHATSAPP',   label: 'WhatsApp',   color: '#86EFAC' },
  { type: 'WAIT',       label: 'Aguardar',   color: '#9B9589' },
];

export default function MapView() {
  const [processes, setProcesses] = useState([]);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      const { data } = await processesApi.getAll();
      setProcesses(data);
      if (data.length > 0) {
        selectProcess(data[0]);
      } else {
        setNodes(DEFAULT_NODES);
        setEdges(DEFAULT_EDGES);
      }
    } catch (err) {
      console.error('Erro ao carregar processos', err);
    } finally {
      setLoading(false);
    }
  };

  const selectProcess = (p) => {
    setCurrentProcess(p);
    setNodes(p.graphData.nodes || []);
    setEdges(p.graphData.edges || []);
  };

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({
      ...params,
      animated: false,
      style: { stroke: 'rgba(250,212,133,0.4)', strokeWidth: 1.5 },
    }, eds));
  }, [setEdges]);

  const addNode = (type) => {
    const newNode = {
      id: Date.now().toString(),
      type: 'wise',
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 300 },
      data: { type, label: NODE_TYPES_LIST.find(t => t.type === type)?.label || type },
    };
    setNodes(ns => [...ns, newNode]);
  };

  const deleteSelected = () => {
    setNodes(ns => ns.filter(n => !n.selected));
    setEdges(es => es.filter(e => !e.selected));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const graphData = { nodes, edges };
      const payload = {
        id: currentProcess?.id,
        name: currentProcess?.name || 'Novo Processo Comercial',
        graphData
      };
      
      const { data } = await processesApi.save(payload);
      setCurrentProcess(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadProcesses();
    } catch (err) {
      console.error('Erro ao salvar processo', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    const selectedNode = nodes.find(n => n.selected);
    if (!selectedNode || !currentProcess) return;

    setExecuting(true);
    try {
      // Para fins de demonstração, vamos pegar o primeiro lead recém criado
      const { data: leads } = await leadsApi.getAll();
      const targetLead = leads[0];
      
      if (!targetLead) {
         alert('Crie um lead no CRM antes de testar a execução do mapa.');
         return;
      }

      const res = await processesApi.execute(currentProcess.id, selectedNode.id, targetLead.id);
      alert(res.data.message || 'Ação disparada!');
    } catch (err) {
      console.error('Erro ao executar nó', err);
    } finally {
      setExecuting(false);
    }
  };

  if (loading && processes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FAD485] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] animate-fade-in space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-2 bg-[#0A0A07] border border-white/10 px-4 py-2 rounded-xl text-white hover:border-[#FAD485] transition-all">
              <span className="text-sm font-bold">{currentProcess?.name || 'Selecione um Processo'}</span>
              <ChevronDown className="w-4 h-4 text-[#6B6860]" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-64 bg-[#0A0A07] border border-white/10 rounded-xl overflow-hidden hidden group-hover:block z-50 shadow-2xl">
              {processes.map(p => (
                <button key={p.id} onClick={() => selectProcess(p)}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-[#E8E6DF] hover:bg-white/5 hover:text-[#FAD485] border-b border-white/5 last:border-0 transition-all">
                  {p.name}
                </button>
              ))}
              <button onClick={() => { setCurrentProcess(null); setNodes(DEFAULT_NODES); setEdges(DEFAULT_EDGES); }}
                className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-[#FAD485] hover:bg-[#FAD485]/10 flex items-center gap-2">
                <Plus className="w-3 h-3" /> Criar Novo Mapa
              </button>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase italic invisible md:visible">Flow Engine</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nodes.some(n => n.selected) && (
            <button onClick={handleExecute} disabled={executing}
              className="px-4 py-2 rounded-xl bg-[#FAD485]/10 border border-[#FAD485]/20 text-[#FAD485] text-xs font-black uppercase flex items-center gap-2 hover:bg-[#FAD485]/20 transition-all">
              {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Executar Nó
            </button>
          )}
          <button onClick={deleteSelected} className="btn-ghost text-sm gap-1.5"
            style={{ color: 'rgba(239,68,68,0.6)' }}>
            <Trash2 className="w-3.5 h-3.5" /> Remover
          </button>
          <button onClick={handleSave} className="btn-secondary text-sm gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saved ? '✓ Salvo!' : 'Salvar Mapa'}
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(250,212,133,0.10)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: '#000000' }}
          defaultEdgeOptions={{ style: { stroke: 'rgba(250,212,133,0.3)', strokeWidth: 1.5 } }}
        >
          <Background color="rgba(250,212,133,0.04)" gap={24} size={1} />
          <Controls style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.10)', borderRadius: '12px', overflow: 'hidden' }} />
          <MiniMap
            style={{ background: '#060604', border: '1px solid rgba(250,212,133,0.10)', borderRadius: '12px' }}
            nodeColor={n => {
              const t = n.data?.type;
              if (t === 'CLOSE') return '#86EFAC';
              if (t === 'LOST') return '#FCA5A5';
              if (t === 'AI_ANALYZE') return '#FAD485';
              return '#A5B4FC';
            }}
          />

          {/* Add Node Panel */}
          <Panel position="top-left">
            <div className="rounded-2xl p-3 space-y-2" style={{ background: '#0A0A07', border: '1px solid rgba(250,212,133,0.10)', width: '180px' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Plus className="w-3.5 h-3.5" style={{ color: '#FAD485' }} />
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#FAD485' }}>Adicionar Nó</p>
              </div>
              {NODE_TYPES_LIST.map(nt => (
                <button key={nt.type} onClick={() => addNode(nt.type)}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-2"
                  style={{ color: '#E8E6DF' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${nt.color}12`; e.currentTarget.style.color = nt.color; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E8E6DF'; }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: nt.color }} />
                  {nt.label}
                </button>
              ))}
            </div>
          </Panel>

          {/* AI Hint Panel */}
          <Panel position="top-right">
            <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
              style={{ background: 'rgba(250,212,133,0.06)', border: '1px solid rgba(250,212,133,0.12)' }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#FAD485' }} />
              <p className="text-[11px] font-semibold" style={{ color: '#FAD485' }}>
                Conecte nós arrastando as alças laterais
              </p>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
