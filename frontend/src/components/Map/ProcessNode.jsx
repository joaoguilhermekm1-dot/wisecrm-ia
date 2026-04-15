import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles, Zap, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

/**
 * Stitch Design System: Premium Nodes for Wise CRM
 */

export const ProcessNode = ({ data, selected }) => {
  const isTrigger = data.type === 'trigger';
  const isIA = data.type === 'ia';
  const isAction = data.type === 'action';
  const isWait = data.type === 'wait';

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        "px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[180px] transition-all duration-500",
        selected ? "border-brand-500 ring-4 ring-brand-500/20" : "border-slate-800 bg-slate-900/80 hover:border-slate-700",
        isIA && "border-indigo-500/50 bg-indigo-900/10",
        isTrigger && "border-amber-500/50 bg-amber-900/10"
      )}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-700 border-none" />
      
      <div className="flex items-center gap-3">
        <div className={clsx(
          "p-2 rounded-lg text-white shadow-lg",
          isTrigger ? "bg-amber-500" : isIA ? "bg-indigo-500" : isWait ? "bg-slate-700" : "bg-brand-600"
        )}>
          {isTrigger && <Zap className="w-4 h-4" />}
          {isIA && <Sparkles className="w-4 h-4" />}
          {isAction && <MessageSquare className="w-4 h-4" />}
          {isWait && <Clock className="w-4 h-4" />}
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
            {data.type || 'Etapa'}
          </p>
          <h4 className="text-xs font-bold text-white leading-tight">
            {data.label}
          </h4>
        </div>
      </div>

      {data.description && (
        <p className="mt-2 text-[10px] text-slate-400 leading-relaxed border-t border-slate-800 pt-2 italic">
          {data.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
         <span className={clsx(
           "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase",
           data.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
         )}>
           {data.isActive ? 'Ativo' : 'Offline'}
         </span>
         <button 
           onClick={() => data.onAction && data.onAction(data)}
           className="text-slate-500 hover:text-brand-400 transition-colors"
         >
           <ArrowRight className="w-3 h-3" />
         </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-700 border-none" />
    </motion.div>
  );
};
