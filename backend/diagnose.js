const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  try {
    console.log('--- Diagnosis Start ---');
    
    // 1. Check User
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('No users found in DB!');
    } else {
      console.log('User found:', user.email);
    }

    // 2. Check Pipeline
    const pipeline = await prisma.pipeline.findFirst();
    if (!pipeline) {
      console.error('No pipeline found!');
    } else {
      console.log('Pipeline found:', pipeline.name);
      console.log('Stages:', pipeline.stages);
      console.log('Stages type:', typeof pipeline.stages);
    }

    // 3. Check Leads
    const leadsCount = await prisma.lead.count();
    console.log('Leads count:', leadsCount);

    // 4. Test Query for Analytics
    const ownerId = user?.id;
    if (ownerId) {
      const adMetrics = await prisma.adMetric.aggregate({
        where: { userId: ownerId },
        _sum: { spend: true, clicks: true }
      });
      console.log('AdMetrics aggregate:', adMetrics);
    }

    console.log('--- Diagnosis End ---');
  } catch (err) {
    console.error('Diagnosis Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
