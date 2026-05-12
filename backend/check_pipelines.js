const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const pipelines = await prisma.pipeline.findMany();
  console.log(JSON.stringify(pipelines, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
