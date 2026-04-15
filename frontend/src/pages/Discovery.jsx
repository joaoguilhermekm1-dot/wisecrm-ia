import React, { useState } from 'react';
import { Search, Loader2, Zap, User, Mail, Globe, Building2, Play, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { prospectingApi, leadsApi } from '../services/api';

const ACTOR_OPTIONS = [
  { id: 'compass/crawler-google-places',     label: 'Google Maps — Empresas Locais',   icon: '📍', desc: 'Extrai dados de negócios: telefone, site, e-mail, avaliação' },
];

function LeadResultCard({ lead, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl animate-fade-in overflow-hidden transition-all"
      style={{
        background: '#0A0A07',
        border: '1px solid rgba(250,212,133,0.07)',
        animationDelay: `${index * 40}ms`,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(250,212,133,0.16)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = !expanded ? 'rgba(250,212,133,0.07)' : 'rgba(250,212,133,0.2)'}
    >
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
            style={{ background: 'rgba(250,212,133,0.08)', color: '#FAD485' }}>
            {(lead.name || lead.username || 'L').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{lead.name || lead.username || 'Lead'}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {lead.category && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6B6860' }}>
                  <Building2 className="w-3 h-3" /> {lead.category}
                </span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: '#86EFAC' }}>
                  📞 {lead.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.followersCount && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(250,212,133,0.08)', color: '#FAD485' }}>
              {Number(lead.followersCount).toLocaleString('pt-BR')} seguidores
            </span>
          )}
          {lead.rating && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(34,197,94,0.08)', color: '#86EFAC' }}>
              ⭐ {lead.rating}
            </span>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-dashed" style={{ borderColor: 'rgba(250,212,133,0.08)' }}>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#6B6860' }}>E-mail</p>
              <p className="text-xs text-white break-all">{lead.email || lead.publicEmail || 'Não disponível'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#6B6860' }}>Site Original</p>
              {lead.website ? (
                 <a href={lead.website} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 truncate block">
                    {lead.website}
                 </a>
              ) : <p className="text-xs text-white">Nenhum website listado</p>}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#6B6860' }}>Informação do Google Maps</p>
              {lead.url ? (
                 <a href={lead.url} target="_blank" rel="noreferrer" className="text-xs text-[#FAD485] hover:underline truncate block">
                    Abrir link no Maps 📍
                 </a>
              ) : <p className="text-xs text-white">N/A</p>}
            </div>
            {lead.instagram && (
            <div>
              <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#6B6860' }}>Instagram Oficial</p>
                 <a href={lead.instagram} target="_blank" rel="noreferrer" className="text-xs text-pink-400 hover:underline truncate block">
                    Acessar Perfil
                 </a>
            </div>
            )}
            <div className="col-span-2">
              <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#6B6860' }}>Endereço (Se disponível)</p>
              <p className="text-xs text-white">{lead.address || 'Não informado'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Discovery() {
  const [selectedActor, setSelectedActor] = useState('');
  const [query, setQuery]               = useState('');
  const [location, setLocation]         = useState('');
  const [maxResults, setMaxResults]     = useState(20);
  const [loading, setLoading]           = useState(false);
  const [results, setResults]           = useState([]);
  const [runId, setRunId]               = useState(null);
  const [error, setError]               = useState('');
  const [status, setStatus]             = useState('idle'); // idle | running | done | error
  const [importing, setImporting]       = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const startSearch = async () => {
    if (!selectedActor || !query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setStatus('running');

    try {
      const finalQuery = location.trim() ? `${query.trim()} em ${location.trim()}` : query.trim();
      
      const res = await prospectingApi.startMission({
        actorId:    selectedActor,
        query:      finalQuery,
        maxResults: Number(maxResults),
      });
      setRunId(res.data.runId);

      // Poll for results
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await prospectingApi.getStatus(res.data.runId);
          if (statusRes.data.status === 'SUCCEEDED' || statusRes.data.items?.length > 0) {
            clearInterval(poll);
            setResults(statusRes.data.items || []);
            setStatus('done');
            setLoading(false);
          } else if (statusRes.data.status === 'FAILED' || attempts > 30) {
            clearInterval(poll);
            setError(statusRes.data.status === 'FAILED' ? 'A busca falhou. Verifique sua chave Apify.' : 'Tempo esgotado. Tente novamente.');
            setStatus('error');
            setLoading(false);
          }
        } catch {
          clearInterval(poll);
          setError('Erro ao verificar status. Configure APIFY_TOKEN no backend.');
          setStatus('error');
          setLoading(false);
        }
      }, 3000);

    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao iniciar busca. Verifique se APIFY_TOKEN está configurado no .env do backend.';
      setError(msg);
      setStatus('error');
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!results.length) return;
    const headers = ['Nome', 'Email', 'Website', 'Categoria', 'Seguidores', 'Avaliação'];
    const rows = results.map(r => [
      r.name || r.username || '',
      r.email || '',
      r.website || '',
      r.category || '',
      r.followersCount || '',
      r.rating || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-discovery-${Date.now()}.csv`; a.click();
  };

  const importToFunnel = async () => {
    if (!results.length) return;
    setImporting(true);
    try {
      await leadsApi.batchCreate(results);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 5000);
    } catch (err) {
      setError('Erro ao importar leads para o funil.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Centro de Descoberta</h1>
        <p className="text-sm mt-1" style={{ color: '#6B6860' }}>
          Prospecção automatizada de leads com inteligência artificial via Apify
        </p>
      </div>

      {/* Config Card */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4" style={{ color: '#FAD485' }} />
          <h2 className="text-sm font-bold text-white">Configurar Missão de Prospecção</h2>
        </div>

        {/* Actor Selection */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#9B9589' }}>
            1. Selecione o tipo de busca
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {ACTOR_OPTIONS.map(actor => (
              <button
                key={actor.id}
                onClick={() => setSelectedActor(actor.id)}
                className="text-left p-3.5 rounded-xl transition-all"
                style={{
                  background: selectedActor === actor.id ? 'rgba(250,212,133,0.08)' : '#060604',
                  border: `1px solid ${selectedActor === actor.id ? 'rgba(250,212,133,0.30)' : 'rgba(250,212,133,0.07)'}`,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl leading-none">{actor.icon}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: selectedActor === actor.id ? '#FAD485' : '#E8E6DF' }}>
                      {actor.label}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#4A4840' }}>{actor.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#9B9589' }}>
            2. Palavra-chave / Termo de busca
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              className="input-field"
              placeholder='Ex: "clínica odontológica" / "marketing"'
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && startSearch()}
            />
            <input
              type="text"
              className="input-field"
              placeholder='Localidade Ex: "Juína, MT" (Opcional)'
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && startSearch()}
            />
          </div>
        </div>

        {/* Max Results */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#9B9589' }}>
            3. Quantidade máxima de leads
          </label>
          <div className="flex gap-2">
            {[10, 20, 50, 100].map(n => (
              <button key={n} onClick={() => setMaxResults(n)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: maxResults === n ? 'linear-gradient(135deg,#FAD485,#F5C842)' : '#060604',
                  color: maxResults === n ? '#000' : '#6B6860',
                  border: `1px solid ${maxResults === n ? 'transparent' : 'rgba(250,212,133,0.08)'}`,
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={startSearch}
          disabled={loading || !selectedActor || !query.trim()}
          className="btn-primary w-full text-sm"
          style={{ opacity: (!selectedActor || !query.trim()) ? 0.4 : 1 }}
        >
          {loading
            ? <><div className="wise-spinner w-4 h-4" /> Buscando leads...</>
            : <><Play className="w-4 h-4" /> Iniciar Prospecção</>
          }
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl animate-fade-in"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#FCA5A5' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#FCA5A5' }}>Erro na prospecção</p>
            <p className="text-xs mt-1" style={{ color: '#9B9589' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {status === 'done' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: '#86EFAC' }} />
              <h3 className="text-sm font-bold text-white">{results.length} leads encontrados</h3>
            </div>
            <div className="flex gap-2 items-center">
              <button 
                onClick={importToFunnel} 
                disabled={importing || importSuccess}
                className="btn-primary py-2 px-3 text-xs gap-1.5"
                style={importSuccess ? { background: '#22c55e', color: '#fff' } : {}}
              >
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 
                 importSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                 <User className="w-3.5 h-3.5" />}
                {importSuccess ? 'Importado!' : 'Enviar para o Funil'}
              </button>
              <button onClick={downloadCSV} className="btn-secondary py-2 px-3 text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="card text-center py-10">
              <Search className="w-8 h-8 mx-auto mb-3" style={{ color: '#4A4840' }} />
              <p className="text-sm" style={{ color: '#6B6860' }}>Nenhum resultado para este termo. Tente outra palavra-chave.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((lead, i) => <LeadResultCard key={lead.placeId || lead.url || lead.username || lead.id || i} lead={lead} index={i} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
