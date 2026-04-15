const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testando conexão com o Banco de Dados...');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Conexão bem sucedida! Usuários encontrados:', users.length);
    process.exit(0);
  } catch (err) {
    console.error('ERRO DE CONEXÃO COM O BANCO:', err.message);
    process.exit(1);
  }
}

test();
