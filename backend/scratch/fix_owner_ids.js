const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  const user = await prisma.user.findFirst({ where: { email: 'joao@wise.com' } });
  if (!user) {
    console.error('Usuário joao@wise.com não encontrado!');
    process.exit(1);
  }

  const result = await prisma.lead.updateMany({
    where: { ownerId: { not: user.id } },
    data: { ownerId: user.id }
  });

  console.log(`Migrados ${result.count} leads para o proprietário: ${user.email}`);
  process.exit(0);
}

migrate();
