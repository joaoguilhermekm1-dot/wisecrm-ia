const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  const email = 'joao@wise.com';
  const newPass = 'wise2026';
  
  try {
    const passwordHash = await bcrypt.hash(newPass, 12);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: {
        email,
        passwordHash,
        name: 'João Kaminski'
      }
    });
    
    console.log(`SUCESSO! Senha resetada para o e-mail: ${email}`);
    console.log(`Sua nova senha é: ${newPass}`);
    process.exit(0);
  } catch (err) {
    console.error('ERRO AO RESETAR SENHA:', err.message);
    process.exit(1);
  }
}

reset();
