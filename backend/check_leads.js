const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const leads = await prisma.lead.findMany();
  console.log(`Total leads: ${leads.length}`);
  leads.forEach((l, i) => {
    console.log(`[${i}] ID: ${l.id} | Name: ${l.name} | Status: ${l.status} | Has Meta: ${!!l.metadata}`);
  });
}
check().catch(console.error).finally(() => prisma.$disconnect());
