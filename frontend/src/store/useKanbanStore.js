import { create } from 'zustand';

export const useKanbanStore = create((set) => ({
  stages: [],
  opportunities: {}, // Record<stageId, Opportunity[]>
  isLoading: false,

  setStages: (stages) => set({ stages }),
  setOpportunities: (stageId, opps) => set((state) => ({
    opportunities: { ...state.opportunities, [stageId]: opps }
  })),

  // Atualização Otimista no Drag & Drop
  moveOpportunityOptimistic: (sourceStageId, targetStageId, oppId) => set((state) => {
    const sourceOpps = [...(state.opportunities[sourceStageId] || [])];
    const targetOpps = [...(state.opportunities[targetStageId] || [])];
    
    const oppIndex = sourceOpps.findIndex(o => o.id === oppId);
    if (oppIndex === -1) return state;

    const [movedOpp] = sourceOpps.splice(oppIndex, 1);
    movedOpp.pipelineStageId = targetStageId;
    targetOpps.push(movedOpp);

    return {
      opportunities: {
        ...state.opportunities,
        [sourceStageId]: sourceOpps,
        [targetStageId]: targetOpps
      }
    };
  })
}));
