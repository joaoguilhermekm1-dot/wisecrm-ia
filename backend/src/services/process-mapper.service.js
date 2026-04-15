const Anthropic = require('@anthropic-ai/sdk');

class ProcessMapperService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Converte uma nota do Obsidian em um Mapa Visual do React Flow (Nodes/Edges).
   */
  async mapNoteToProcess(noteContent) {
    const prompt = `
      Você é um Engenheiro de Processos Sênior e arquiteto de Design System (Estética Stitch/Google).
      Converta a seguinte nota de estratégia comercial em um JSON compatível com React Flow.

      REGRAS DE DESIGN:
      - Use node type 'process' para todos.
      - Defina data.type como: 'trigger' (entrada), 'ia' (análise), 'action' (ação), 'wait' (espera).
      - Mantenha a estética premium: descrições curtas e títulos fortes.
      - Posicione os nós em uma cascata vertical (x fixo em 250, y incrementando de 150 em 150).

      NOTA DO OBSIDIAN:
      ${noteContent}

      Retorne APENAS um JSON no formato:
      {
        "nodes": [ { "id": "1", "type": "process", "position": {"x": 250, "y": 0}, "data": { "type": "...", "label": "...", "description": "..." } }, ... ],
        "edges": [ { "id": "e1-2", "source": "1", "target": "2", "animated": true }, ... ]
      }
    `;

    try {
      const response = await this.client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const jsonStr = response.content[0].text.match(/\{[\s\S]*\}/)[0];
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error('[ProcessMapper] Erro na geração via IA:', err.message);
      throw err;
    }
  }
}

module.exports = new ProcessMapperService();
