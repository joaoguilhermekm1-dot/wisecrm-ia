const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('wise2026', 12);
  const user = await prisma.user.upsert({
    where: { email: 'joao@wise.com' },
    update: { passwordHash: hash, name: 'João Wise', role: 'ADMIN' },
    create: { email: 'joao@wise.com', passwordHash: hash, name: 'João Wise', role: 'ADMIN' }
  });
  console.log('✅ Usuário criado/atualizado:', user.email, '| Senha: wise2026');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
