const KanbanService = require('../../services/kanban.service');

exports.moveOpportunity = async (req, res) => {
  try {
    const { id } = req.params; // opportunity ID
    const { targetStageId, diagnosis } = req.body;
    
    // Supondo que o middleware de auth injeta req.user.companyId
    // Como a V1 pode não ter companyId injetado perfeitamente ainda, 
    // faremos fallback para o userId ou deixaremos explicito.
    const companyId = req.user.companyId || req.user.userId;

    if (!targetStageId) {
      return res.status(400).json({ success: false, error: 'targetStageId é obrigatório.' });
    }

    const result = await KanbanService.moveOpportunityStage(companyId, id, targetStageId, diagnosis);
    
    // Todo: Emitir Socket.io event (kanban_mutated) aqui ou no service
    
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.message.includes('BLOD Constraint')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('[KanbanController.moveOpportunity] Error:', error);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor.' });
  }
};
