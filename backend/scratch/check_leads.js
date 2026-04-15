const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const leads = await prisma.lead.findMany({
    select: { id: true, name: true, status: true, phone: true }
  });
  console.log('--- LEADS ---');
  console.log(JSON.stringify(leads, null, 2));
  
  const pipelines = await prisma.pipeline.findMany();
  console.log('--- PIPELINES ---');
  console.log(JSON.stringify(pipelines, null, 2));
  
  process.exit(0);
}

check();
