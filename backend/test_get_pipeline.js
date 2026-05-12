const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const pipeline = await prisma.pipeline.findFirst();
  console.log("Raw stages:", pipeline.stages);
  console.log("Is array?", Array.isArray(pipeline.stages));
  console.log("Typeof:", typeof pipeline.stages);
}
main().finally(() => prisma.$disconnect());
