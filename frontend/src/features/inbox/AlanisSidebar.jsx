import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import LiquidGlass from 'liquid-glass-react';

export default function AlanisSidebar() {
  const { alanisRationale, activeLeadId } = useChatStore();

  if (!activeLeadId) return null;

  return (
    <div className="h-full flex flex-col p-6 bg-slate-900 text-white overflow-y-auto border-l border-slate-800">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <LiquidGlass
          displacementScale={40}
          blurAmount={0.2}
          saturation={120}
          aberrationIntensity={1}
          elasticity={0.4}
          cornerRadius={999}
          padding="12px"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white font-bold text-2xl">
            A
          </div>
        </LiquidGlass>
        <div>
          <h3 className="font-bold text-lg text-slate-100 tracking-wide">Alanis V3</h3>
          <p className="text-xs text-indigo-400 uppercase tracking-widest font-semibold mt-1">AI Co-Pilot</p>
        </div>
      </div>

      {!alanisRationale ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-full border-t-2 border-indigo-500 animate-spin mb-4"></div>
          <p className="text-sm text-slate-400 font-medium animate-pulse">
            Sintetizando histórico do lead...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Análise Comportamental usando LiquidGlass */}
          <LiquidGlass
            displacementScale={20}
            blurAmount={0.3}
            saturation={100}
            elasticity={0.1}
            cornerRadius={16}
            className="border border-slate-700/50"
          >
            <div className="p-5 bg-slate-800/40 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Perfil DISC</h4>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-xs font-mono font-bold">
                    D: {alanisRationale.discEstimate?.d || 0}%
                  </span>
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-mono font-bold">
                    I: {alanisRationale.discEstimate?.i || 0}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {alanisRationale.reasoning}
              </p>
            </div>
          </LiquidGlass>

          {/* Sugestão de Ancoragem (Método Wise) */}
          <LiquidGlass
            displacementScale={30}
            blurAmount={0.4}
            saturation={150}
            elasticity={0.2}
            cornerRadius={16}
            className="border border-indigo-500/30"
          >
            <div className="p-5 bg-indigo-900/20 backdrop-blur-md">
               <h4 className="flex items-center gap-2 text-xs uppercase font-bold text-indigo-400 tracking-wider mb-3">
                 <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                 Sugestão Wise
               </h4>
               <p className="text-sm italic text-indigo-100 font-medium leading-relaxed">
                 "{alanisRationale.suggestedReply}"
               </p>
               <button className="mt-5 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm py-2.5 rounded-lg font-semibold hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-900/50 transition-all active:scale-95">
                 Copiar Insight
               </button>
            </div>
          </LiquidGlass>
        </div>
      )}
    </div>
  );
}
