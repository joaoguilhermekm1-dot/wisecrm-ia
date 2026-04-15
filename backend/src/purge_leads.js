const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purgeLeads() {
  try {
    console.log('Deletando mensagens...');
    await prisma.message.deleteMany({});
    
    console.log('Deletando conversas...');
    await prisma.conversation.deleteMany({});
    
    console.log('Deletando leads...');
    await prisma.lead.deleteMany({});
    
    console.log('Todos os leads e histórico limpados com sucesso!');
  } catch (err) {
    console.error('Erro ao deletar:', err);
  } finally {
    await prisma.$disconnect();
  }
}

purgeLeads();
