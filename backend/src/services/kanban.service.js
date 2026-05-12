const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class KanbanService {
  /**
   * Move uma Oportunidade para outro estágio.
   * Aplica a trava do BLOD (Diagnóstico obrigatório para fechamento).
   */
  static async moveOpportunityStage(companyId, opportunityId, targetStageId, diagnosisUpdate = null) {
    // Verificar se o targetStageId pertence a mesma empresa
    const targetStage = await prisma.pipelineStage.findFirst({
      where: { id: targetStageId, companyId }
    });

    if (!targetStage) {
      throw new Error('Estágio alvo não encontrado ou não pertence a esta empresa.');
    }

    // Buscar a oportunidade
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { lead: true }
    });

    if (!opportunity) {
      throw new Error('Oportunidade não encontrada.');
    }

    if (opportunity.lead.companyId !== companyId) {
      throw new Error('Violação de Multitenancy: Oportunidade não pertence à sua empresa.');
    }

    // Regra BLOD: Se o targetStage é de ganho/fechamento (ou próximo disso), exige diagnóstico
    // Vamos usar o nome para identificar, ou uma flag isWonStage
    if (targetStage.isWonStage || targetStage.name.toUpperCase().includes('FECHAMENTO')) {
      const currentDiagnosis = opportunity.lead.diagnosis;
      
      let hasValidDiagnosis = false;
      if (currentDiagnosis) {
        hasValidDiagnosis = currentDiagnosis.pain && currentDiagnosis.scenario;
      }
      
      // Se não tinha antes, checa se está vindo no update
      if (!hasValidDiagnosis && diagnosisUpdate) {
         hasValidDiagnosis = diagnosisUpdate.pain && diagnosisUpdate.scenario;
      }

      if (!hasValidDiagnosis) {
        throw new Error('BLOD Constraint: Impossível avançar para fechamento sem preencher o Diagnóstico (Dor e Cenário).');
      }
    }

    // Se passou, podemos atualizar o diagnóstico do lead se fornecido
    if (diagnosisUpdate) {
      await prisma.lead.update({
        where: { id: opportunity.leadId },
        data: { diagnosis: diagnosisUpdate }
      });
    }

    // Mover a oportunidade
    const updatedOpp = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { pipelineStageId: targetStageId }
    });

    return updatedOpp;
  }
}

module.exports = KanbanService;
