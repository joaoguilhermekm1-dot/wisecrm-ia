const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Iniciando migração de nomes de etapas...');
  
  // 1. Atualizar Pipelines
  const pipelines = await prisma.pipeline.findMany();
  for (const pipe of pipelines) {
    let stages = Array.isArray(pipe.stages) ? pipe.stages : JSON.parse(pipe.stages || '[]');
    const newStages = stages.map(s => {
      if (s === 'PROSPECÇÂO' || s === 'PROSPECCAO') return 'PROSPECÇÃO';
      if (s === 'DIAGNOSTICO') return 'DIAGNÓSTICO';
      if (s === 'FOLOWUP') return 'FOLLOW-UP';
      return s;
    });
    
    await prisma.pipeline.update({
      where: { id: pipe.id },
      data: { stages: newStages }
    });
    console.log(`✅ Pipeline ${pipe.id} atualizado.`);
  }

  // 2. Atualizar Leads
  const leads = await prisma.lead.findMany();
  for (const lead of leads) {
    let newStatus = lead.status;
    if (lead.status === 'PROSPECÇÂO' || lead.status === 'PROSPECCAO') newStatus = 'PROSPECÇÃO';
    if (lead.status === 'DIAGNOSTICO') newStatus = 'DIAGNÓSTICO';
    if (lead.status === 'FOLOWUP') newStatus = 'FOLLOW-UP';
    
    if (newStatus !== lead.status) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: newStatus }
      });
      console.log(`✅ Lead ${lead.id} movido para ${newStatus}.`);
    }
  }

  console.log('🏁 Migração concluída!');
  await prisma.$disconnect();
}

migrate().catch(err => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});
