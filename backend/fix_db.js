const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('🚀 Corrigindo strings corrompidas no DB...');
  
  // 1. Corrigir Pipelines
  const pipelines = await prisma.pipeline.findMany();
  for (const pipe of pipelines) {
    let stages = Array.isArray(pipe.stages) ? pipe.stages : JSON.parse(pipe.stages || '[]');
    const newStages = stages.map(s => {
      if (s === 'DIAGNDIAGNOSTICO') return 'DIAGNÓSTICO';
      if (s === 'PROSPECÇÂO') return 'PROSPECÇÃO';
      if (s === 'FOLOWUP') return 'FOLLOW-UP';
      return s;
    });
    
    await prisma.pipeline.update({
      where: { id: pipe.id },
      data: { stages: newStages }
    });
  }

  // 2. Corrigir Leads
  const leads = await prisma.lead.findMany();
  for (const lead of leads) {
    let newStatus = lead.status;
    if (lead.status === 'DIAGNDIAGNOSTICO') newStatus = 'DIAGNÓSTICO';
    if (lead.status === 'PROSPECÇÂO') newStatus = 'PROSPECÇÃO';
    if (lead.status === 'FOLOWUP') newStatus = 'FOLLOW-UP';
    
    if (newStatus !== lead.status) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: newStatus }
      });
    }
  }

  console.log('🏁 DB Limpo!');
  await prisma.$disconnect();
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
