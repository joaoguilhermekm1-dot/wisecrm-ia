const prisma = require('../lib/prisma');

const DEFAULT_STAGES = ['NEW', 'DIAGNÓSTICO', 'PROPOSTA', 'FECHAMENTO', 'PERDIDO'];

exports.getPipeline = async (req, res) => {
  const userId = req.user.userId;
  try {
    let pipeline = await prisma.pipeline.findFirst({
      where: { userId }
    });

    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: {
          name: 'Funil Wise (Padrão)',
          stages: DEFAULT_STAGES,
          userId
        }
      });
    }

    // Auto-repair: se pipeline tem menos de 3 estágios, forçar reset para o padrão
    let stages = [];
    if (typeof pipeline.stages === 'string') {
      try { stages = JSON.parse(pipeline.stages); } catch (e) { stages = []; }
    } else if (Array.isArray(pipeline.stages)) {
      stages = pipeline.stages;
    }

    if (stages.length < 3) {
      pipeline = await prisma.pipeline.update({
        where: { id: pipeline.id },
        data: { stages: DEFAULT_STAGES }
      });
      stages = DEFAULT_STAGES;
    }
    
    // Assegura que mande pro front-end formatado como array
    pipeline.stages = stages;

    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pipeline.' });
  }
};

exports.updateStages = async (req, res) => {
  const userId = req.user.userId;
  const { stages } = req.body;

  if (!stages || !Array.isArray(stages)) {
    return res.status(400).json({ error: 'Stages inválidos.' });
  }

  try {
    const pipeline = await prisma.pipeline.findFirst({
      where: { userId }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline não encontrada.' });
    }

    const updated = await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: { stages }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar etapas.' });
  }
};

exports.resetPipeline = async (req, res) => {
  const userId = req.user.userId;
  try {
    const pipeline = await prisma.pipeline.findFirst({ where: { userId } });

    let updated;
    if (pipeline) {
      updated = await prisma.pipeline.update({
        where: { id: pipeline.id },
        data: { stages: DEFAULT_STAGES }
      });
    } else {
      updated = await prisma.pipeline.create({
        data: { name: 'Funil Wise (Padrão)', stages: DEFAULT_STAGES, userId }
      });
    }

    res.json({ message: 'Pipeline redefinida para o padrão.', pipeline: updated });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao redefinir pipeline.' });
  }
};
