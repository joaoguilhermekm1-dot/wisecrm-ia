const fs = require('fs/promises');
const path = require('path');

/**
 * Obsidian Service
 * Responsável por ler e indexar o "Segundo Cérebro" localmente.
 */
class ObsidianService {
  constructor() {
    this.vaultPath = '/Users/joaoguilhermekaminskidesouza/Documents/Obsidian Vault';
    this.priorityFolders = ['03 - Conhecimento', '04 - Operacional'];
  }

  /**
   * Lê as notas principais e as combina em um contexto de texto para a IA.
   */
  async getBrainContext() {
    console.log('[Wise Brain] Lendo conhecimento do Obsidian...');
    let context = '';

    try {
      for (const folder of this.priorityFolders) {
        const fullPath = path.join(this.vaultPath, folder);
        const files = await fs.readdir(fullPath);

        for (const file of files) {
          if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(fullPath, file), 'utf-8');
            // Remove frontmatter simples (opcional)
            const cleanContent = content.replace(/^---[\s\S]*?---/, '');
            
            context += `\n### ARQUIVO: ${file}\n`;
            context += cleanContent + '\n';
          }
        }
      }

      return context;
    } catch (err) {
      console.error('[Wise Brain] Erro ao ler vault do Obsidian:', err.message);
      return '';
    }
  }

  /**
   * Busca por uma nota específica se necessário (ex: por nome de princípio)
   */
  async getNote(noteName) {
    // Implementação futura de busca por nome de arquivo exato
  }
}

module.exports = new ObsidianService();
