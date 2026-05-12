const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const DEFAULT_STAGES = ['NOVO', 'PROSPECÇÂO', 'DIAGNOSTICO', 'FECHAMENTO', 'FECHADO', 'FOLOWUP'];

async function main() {
  const pipeline = await prisma.pipeline.findFirst();
  if (!pipeline) return console.log("No pipeline found");
  
  try {
    const updated = await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: { stages: DEFAULT_STAGES }
    });
    console.log("Success:", updated);
  } catch (e) {
    console.error("Error updating:", e);
  }
}
main().finally(() => prisma.$disconnect());
