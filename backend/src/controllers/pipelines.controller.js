const prisma = require('../lib/prisma');

const DEFAULT_STAGES = [
  'NOVO',
  'PROSPECÇÃO',
  'DIAGNÓSTICO',
  'FECHAMENTO',
  'FECHADO',
  'FOLLOW-UP'
];

const STAGE_META = {
  'NOVO':        { color: '#FAD485', emoji: '🌱', description: 'Lead acabou de entrar no funil.' },
  'PROSPECÇÃO':  { color: '#60A5FA', emoji: '🔎', description: 'Prospecção ativa — primeiro contato e qualificação.' },
  'DIAGNÓSTICO': { color: '#A78BFA', emoji: '🩺', description: 'Diagnóstico do cliente — entender dores e necessidades.' },
  'FECHAMENTO':  { color: '#FB923C', emoji: '🤝', description: 'Negociação final — proposta enviada, aguardando decisão.' },
  'FECHADO':     { color: '#34D399', emoji: '✅', description: 'Venda fechada! Novo cliente convertido.' },
  'FOLLOW-UP':     { color: '#2DD4BF', emoji: '🔄', description: 'Pós-venda ativo — acompanhamento e fidelização.' },
};

exports.getStageMeta = () => STAGE_META;

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

    let stages = [];
    if (Array.isArray(pipeline.stages)) {
      stages = pipeline.stages;
    } else if (typeof pipeline.stages === 'string') {
      try {
        stages = JSON.parse(pipeline.stages);
      } catch (e) {
        stages = DEFAULT_STAGES;
      }
    }

    if (!stages || stages.length < 3) {
      stages = DEFAULT_STAGES;
      await prisma.pipeline.update({
        where: { id: pipeline.id },
        data: { stages: DEFAULT_STAGES }
      });
    }

    pipeline.stages = stages;
    // Enriquecer com metadata visual das etapas
    pipeline.stageMeta = STAGE_META;
    res.json(pipeline);
  } catch (err) {
    console.error('[getPipeline Error]', err);
    res.status(500).json({ error: 'Erro ao buscar pipeline.' });
  }
};

exports.addStage = async (req, res) => {
  const userId = req.user.userId;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  
  const cleanName = name.trim().toUpperCase();
  if (cleanName.length > 20) return res.status(400).json({ error: 'Nome muito longo (máx 20 caracteres)' });
  if (!/^[A-Z0-9À-Ú ]+$/.test(cleanName)) return res.status(400).json({ error: 'Nome contém caracteres inválidos' });

  try {
    const pipeline = await prisma.pipeline.findFirst({ where: { userId } });
    if (!pipeline) return res.status(404).json({ error: 'Pipeline não encontrada' });

    let stages = Array.isArray(pipeline.stages) ? pipeline.stages : JSON.parse(pipeline.stages || '[]');
    const newName = name.trim().toUpperCase();

    if (stages.includes(newName)) return res.status(400).json({ error: 'Etapa já existe' });

    // Inserir antes de PERDIDO se existir, para manter a ordem lógica
    const perdidoIdx = stages.indexOf('PERDIDO');
    if (perdidoIdx > -1) {
      stages.splice(perdidoIdx, 0, newName);
    } else {
      stages.push(newName);
    }

    const updated = await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: { stages }
    });

    updated.stageMeta = STAGE_META;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar etapa' });
  }
};

exports.renameStage = async (req, res) => {
  const userId = req.user.userId;
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: 'Nomes obrigatórios' });

  try {
    const pipeline = await prisma.pipeline.findFirst({ where: { userId } });
    let stages = Array.isArray(pipeline.stages) ? pipeline.stages : JSON.parse(pipeline.stages || '[]');

    const idx = stages.indexOf(oldName.toUpperCase());
    if (idx === -1) return res.status(404).json({ error: 'Etapa original não encontrada' });

    const cleanNewName = newName.trim().toUpperCase();
    if (cleanNewName.length > 20) return res.status(400).json({ error: 'Nome muito longo (máx 20 caracteres)' });
    if (!/^[A-Z0-9À-Ú ]+$/.test(cleanNewName)) return res.status(400).json({ error: 'Nome contém caracteres inválidos' });

    stages[idx] = cleanNewName;

    await prisma.lead.updateMany({
      where: { pipelineId: pipeline.id, status: oldName.toUpperCase() },
      data: { status: newName.trim().toUpperCase() }
    });

    const updated = await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: { stages }
    });

    updated.stageMeta = STAGE_META;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao renomear etapa' });
  }
};

exports.deleteStage = async (req, res) => {
  const userId = req.user.userId;
  const { name } = req.params;

  try {
    const pipeline = await prisma.pipeline.findFirst({ where: { userId } });
    let stages = Array.isArray(pipeline.stages) ? pipeline.stages : JSON.parse(pipeline.stages || '[]');

    const newStages = stages.filter(s => s !== name.toUpperCase());
    if (newStages.length === stages.length) return res.status(404).json({ error: 'Etapa não encontrada' });

    const fallbackStage = newStages[0] || 'NOVO';
    await prisma.lead.updateMany({
      where: { pipelineId: pipeline.id, status: name.toUpperCase() },
      data: { status: fallbackStage }
    });

    const updated = await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: { stages: newStages }
    });

    updated.stageMeta = STAGE_META;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir etapa' });
  }
};

exports.reorderStages = async (req, res) => {
  const userId = req.user.userId;
  const { stages } = req.body;

  if (!Array.isArray(stages)) return res.status(400).json({ error: 'Array de etapas inválido' });

  try {
    const pipeline = await prisma.pipeline.findFirst({ where: { userId } });
    const updated = await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: { stages }
    });
    updated.stageMeta = STAGE_META;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao reordenar etapas' });
  }
};

exports.resetPipeline = async (req, res) => {
  const userId = req.user.userId;
  try {
    const pipeline = await prisma.pipeline.findFirst({ where: { userId } });
    if (!pipeline) return res.status(404).json({ error: 'Pipeline não encontrada' });

    const updated = await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: { stages: DEFAULT_STAGES }
    });

    updated.stageMeta = STAGE_META;
    res.json({ pipeline: updated, message: 'Pipeline resetada para o Funil Wise padrão.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao resetar pipeline' });
  }
};
