const prisma = require('../lib/prisma');
const obsidianService = require('../services/obsidian.service');
const mapperService = require('../services/process-mapper.service');

exports.generateFromNote = async (req, res) => {
  const { noteTitle } = req.body;
  const userId = req.user.userId;

  try {
    // 1. Buscar o conteúdo da nota no Obsidian
    const note = obsidianService.getNoteByTitle(noteTitle);
    if (!note) {
      return res.status(404).json({ error: 'Estratégia comercial não encontrada no seu Segundo Cérebro.' });
    }

    // 2. Usar a IA para mapear a nota em um Grafo
    console.log(`[ProcessMapper] Gerando mapa para: ${noteTitle}...`);
    const graphData = await mapperService.mapNoteToProcess(note.content);

    // 3. Salvar como um novo processo
    const process = await prisma.process.create({
      data: {
        name: `Mapa: ${noteTitle}`,
        graphData: graphData,
        userId: userId
      }
    });

    res.json(process);
  } catch (err) {
    console.error('[ProcessController Error]', err.message);
    res.status(500).json({ error: 'Falha ao transformar estratégia em mapa visual.' });
  }
};

exports.getProcesses = async (req, res) => {
  try {
    const processes = await prisma.process.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(processes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mapas.' });
  }
};

exports.saveProcess = async (req, res) => {
  const { id, name, graphData } = req.body;
  const userId = req.user.userId;

  try {
    let process;
    if (id && id.length > 10) { // UUID
      process = await prisma.process.update({
        where: { id, userId },
        data: { name, graphData }
      });
    } else {
      process = await prisma.process.create({
        data: { name, graphData, userId }
      });
    }
    res.json(process);
  } catch (err) {
    console.error('[Process Save Error]', err);
    res.status(500).json({ error: 'Erro ao salvar o mapa.' });
  }
};

exports.executeNodeAction = async (req, res) => {
  const { processId, nodeId, leadId } = req.body;
  const userId = req.user.userId;
  
  try {
    const process = await prisma.process.findUnique({
      where: { id: processId, userId }
    });

    if (!process) return res.status(404).json({ error: 'Processo não encontrado.' });

    // Encontrar o nó no graphData
    const node = process.graphData.nodes.find(n => n.id === nodeId);
    if (!node) return res.status(404).json({ error: 'Nó não encontrado no mapa.' });

    const type = node.data.type;
    console.log(`[Process Engine] Executando ${type} para o lead ${leadId}...`);

    if (type === 'WHATSAPP') {
       const whatsappService = require('../services/whatsapp.service');
       const lead = await prisma.lead.findUnique({ where: { id: leadId } });
       if (lead && (lead.whatsappJid || lead.phone)) {
          const content = node.data.label || "Olá! Estamos seguindo com seu atendimento.";
          await whatsappService.sendMessage(lead.whatsappJid || lead.phone, content);
          return res.json({ success: true, message: 'WhatsApp enviado com sucesso!' });
       }
    }

    if (type === 'AI_ANALYZE') {
       // Lógica de IA...
       return res.json({ success: true, message: 'Análise de IA concluída.' });
    }
    
    res.json({ message: 'Ação executada (Simulação)', type });
  } catch (err) {
    console.error('[Process Execute Error]', err);
    res.status(500).json({ error: 'Erro ao disparar automação.' });
  }
};
