const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  await prisma.message.deleteMany();
  await prisma.lead.deleteMany();
  console.log('Todos os leads e mensagens de teste foram limpos com sucesso.');
}
clean().catch(console.error).finally(() => prisma.$disconnect());
