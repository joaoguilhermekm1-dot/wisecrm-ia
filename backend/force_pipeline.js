const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  'NOVO',
  'PROSPECÇÂO',
  'DIAGNOSTICO',
  'FECHAMENTO',
  'FECHADO',
  'FOLOWUP'
];

async function main() {
  // 1. Atualizar todos os Pipelines
  console.log("Atualizando todos os pipelines...");
  await prisma.pipeline.updateMany({
    data: {
      stages: DEFAULT_STAGES
    }
  });

  // 2. Mapear Leads antigos para os novos status
  console.log("Atualizando status dos leads...");
  const leads = await prisma.lead.findMany();
  for (const lead of leads) {
    let newStatus = lead.status.toUpperCase();
    
    // Mapeamento de status antigos para os novos
    if (newStatus === 'NEW') newStatus = 'NOVO';
    if (newStatus === 'DIAGNÓSTICO') newStatus = 'DIAGNOSTICO';
    if (newStatus === 'PROPOSTA') newStatus = 'FECHAMENTO';
    if (newStatus === 'PERDIDO') newStatus = 'FOLOWUP';
    if (newStatus === 'ATIVO') newStatus = 'FECHADO';

    if (!DEFAULT_STAGES.includes(newStatus)) {
      newStatus = 'NOVO'; // Fallback
    }

    if (newStatus !== lead.status) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: newStatus }
      });
    }
  }

  console.log("Migração concluída com sucesso!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
