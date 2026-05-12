const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const mcpService = require('./mcp.service');

/**
 * 🧠 AI Orchestrator Service - MInd IA Core
 * Suporta Multiversal AI e Function Calling (MCP)
 */
class AIOrchestrator {
  constructor() {
    this.primary = process.env.AI_PROVIDER_PRIMARY || 'gemini';
    this.secondary = process.env.AI_PROVIDER_SECONDARY || 'anthropic';
    this.fallback = process.env.AI_PROVIDER_FALLBACK || 'ollama';

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'phi3:mini';
  }

  async call(prompt, systemPrompt = '', options = {}) {
    const providers = [this.primary, this.secondary, this.fallback];
    let lastError = null;

    for (const provider of providers) {
      try {
        console.log(`[AI Orchestrator] Tentando: ${provider}`);
        return await this.executeCall(provider, prompt, systemPrompt, options);
      } catch (err) {
        lastError = err;
        console.warn(`[AI Orchestrator] Falha: ${provider}`, err.message);
        if (err.message.includes('credit') || err.message.includes('429')) continue;
        throw err; // Se for outro erro, para
      }
    }
    throw lastError;
  }

  async executeCall(provider, prompt, systemPrompt, options) {
    if (provider === 'gemini') return await this.callGemini(prompt, systemPrompt, options);
    if (provider === 'anthropic') return await this.callAnthropic(prompt, systemPrompt, options);
    if (provider === 'ollama') return await this.callOllama(prompt, systemPrompt, options);
  }

  async callGemini(prompt, systemPrompt, options) {
    if (!this.gemini) throw new Error('Gemini offline');
    
    // Inserir Ferramentas do MCP se solicitado
    const tools = options.useTools ? mcpService.getAvailableTools() : [];
    
    const chat = this.gemini.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 2048 },
    });

    const fullPrompt = systemPrompt ? `SYSTEM: ${systemPrompt}\n\nUSER: ${prompt}` : prompt;
    
    // Suporte básico a Tool Calling Loop
    let result = await chat.sendMessage(fullPrompt);
    let response = result.response;
    
    // Loop de execução de ferramentas (até 3 iterações)
    for (let i = 0; i < 3; i++) {
        const calls = response.functionCalls();
        if (!calls || calls.length === 0) break;

        const toolResults = [];
        for (const call of calls) {
            const output = await mcpService.executeTool(call.name, call.args, options.userId);
            toolResults.push({
                functionResponse: { name: call.name, response: output }
            });
        }

        result = await chat.sendMessage(toolResults);
        response = result.response;
    }

    return this.parseJSON(response.text());
  }

  async callAnthropic(prompt, systemPrompt, options) {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });
    return this.parseJSON(message.content[0].text);
  }

  async callOllama(prompt, systemPrompt, options) {
    const res = await axios.post(`${this.ollamaUrl}/api/chat`, {
      model: this.ollamaModel,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
      stream: false
    });
    return this.parseJSON(res.data.message.content);
  }

  parseJSON(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    try {
      return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      return { response: text };
    }
  }
}

module.exports = new AIOrchestrator();
