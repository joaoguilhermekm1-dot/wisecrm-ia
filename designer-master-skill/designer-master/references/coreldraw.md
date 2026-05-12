# CorelDRAW — Referência Técnica Avançada

## Por que CorelDRAW ainda domina o mercado de impressão

CorelDRAW é o padrão da indústria de impressão gráfica no Brasil e América Latina. Gráficas, confeccionadoras de brindes, plotters e sistemas de corte geralmente aceitam (e preferem) arquivos .CDR. Dominar CorelDRAW é dominar o elo final entre o design e a produção física.

---

## Interface e Navegação

### Atalhos Fundamentais
| Ação | Atalho |
|------|--------|
| Ferramenta Seleção | F1 |
| Ferramenta Nó (editar vetores) | F10 |
| Ferramenta Texto | T |
| Zoom in/out | F2 / F3 |
| Ver página inteira | F4 |
| Duplicar no lugar | Ctrl+D |
| Agrupar / Desagrupar | Ctrl+G / Ctrl+U |
| Combinar objetos | Ctrl+L |
| Quebrar combinação | Ctrl+K |
| Converter para curvas | Ctrl+Q |
| Alinhar e Distribuir | Shift+P |
| Ordem Z (frente/trás) | PgUp / PgDn |

---

## Técnicas Essenciais

### Vetorização Profissional (Bézier e Nós)
1. Use a **Ferramenta Caneta** (Pen Tool) ou **Bézier** para traçar formas precisas
2. Após traçar, use **Ferramenta de Forma (F10)** para ajustar nós
3. Tipos de nó:
   - **Cúspide**: cria cantos abruptos (ideal para logos geométricos)
   - **Suave**: cria curvas contínuas (ideal para formas orgânicas)
   - **Simétrico**: curvas iguais em ambos os lados
4. Para vectorizar uma imagem bitmap: **Bitmaps > Contorno de Bitmaps > Esboço de Alta Qualidade**
5. Ajuste limiares manualmente — nunca aceite o resultado automático sem revisar nós

### PowerClip (Mascaramento de Alta Performance)
1. Crie o objeto que será a "janela" (ex: forma de logo)
2. Coloque a imagem ou objeto que ficará dentro
3. Selecione a imagem → **Efeitos > PowerClip > Colocar no Quadro**
4. Clique na forma-janela
5. Para editar o conteúdo interno: clique duplo no objeto PowerClip
6. Para centralizar automaticamente: Ctrl+Click durante a inserção

### Blend (Mistura de Objetos)
- Crie transições entre dois objetos (forma, cor, tamanho) com passos controláveis
- Use para criar sombras volumétricas, efeitos 3D básicos, filetes decorativos
- **Efeitos > Blend**: controle número de passos, rotação, aceleração de cor

### Envelope (Distorção de Forma)
- **Efeitos > Envelope**: deforme texto ou objetos para encaixar em formas específicas
- Modos: Reto, Inclinado, Arco, Livre
- Essencial para textos em perspectiva, textos em arco, adaptação a embalagens

### Tratamento de Texto
- **Texto Artístico** (clique simples): para títulos, logos, elementos curtos
- **Texto de Parágrafo** (arrastar caixa): para blocos de texto, editorial
- Converta textos para curvas (**Ctrl+Q**) antes de enviar para gráfica — garante que a fonte apareça mesmo sem estar instalada
- **Formatar Texto (Ctrl+T)**: controle kerning, entrelinha, baseline com precisão tipográfica

---

## Configuração para Impressão Profissional

### Ao Criar o Documento
1. **Unidade**: Milímetros (nunca pixels para impressão)
2. **Resolução**: 300 DPI mínimo
3. **Perfil de cor**: CMYK (ISO Coated v2 para offset padrão)
4. **Sangria**: 3mm em todos os lados (configure em Ferramentas > Opções > Documento > Diretrizes > Sangria)

### Pré-Voo (Preflight) Antes de Enviar
1. **Arquivo > Publicar para PDF** → escolha perfil "PDF/X-4" para impressão
2. Verifique: **Arquivo > Validação de Documento** — reporta fontes não incorporadas, objetos RGB em documentos CMYK, imagens de baixa resolução
3. Marque: "Incorporar fontes", "Converter bitmaps para CMYK", "Manter overprint"
4. Para corte a laser/plotter: use **Contornos de Corte** em espessura 0,001mm com cor "Registration" (preto de registro)

### Cores Especiais
- **Pantone**: janela "Color Palettes" → adicione a paleta Pantone correta
- **Verniz localizado**: crie numa camada separada com cor especial nomeada "Verniz" (confirme o nome com a gráfica)
- **Relevo/Hot Stamping**: mesmo princípio — camada separada com cor especial

---

## Organização de Arquivo Profissional

- Use **Camadas** (Object Manager) para separar: Texto | Arte | Fundo | Marcas de Corte | Sangria
- Nomeie cada camada claramente
- Bloqueie camadas que não estão sendo editadas
- Use **Estilos Gráficos** (Janela > Estilos Gráficos) para padronizar cores e espessuras em projetos grandes
- Para projetos com múltiplas páginas (cardápio, catálogo): use **Página Master** para elementos repetidos (cabeçalho, rodapé, logo)

---

## Erros Clássicos no CorelDRAW

| Erro | Consequência | Solução |
|------|-------------|---------|
| Não converter texto para curvas | Fontes substituídas na gráfica | Sempre Ctrl+Q antes de exportar |
| Objetos em RGB num arquivo CMYK | Cor diferente na impressão | Selecione todos > mude espaço de cor para CMYK |
| Imagens bitmap em baixa resolução | Impressão pixelada | Reimporte imagens a 300 DPI mínimo |
| Esquecer sangria | Bordas brancas no corte | Configure 3mm de sangria e estenda os elementos |
| Usar espessuras de linha muito finas | Linhas desaparecem na impressão offset | Espessura mínima: 0.25pt |

---

## Recursos Menos Conhecidos

- **CorelDRAW Smart Fill**: preenche áreas fechadas formadas por múltiplos objetos sobrepostos — ideal para colorir ilustrações
- **Artistic Media**: pincéis vetoriais com variação de espessura — para efeitos de pintura em vetor
- **Symmetry Drawing Mode**: desenhe e o objeto espelha em tempo real — perfeito para logos simétricos
- **QR Code nativo**: Objeto > Inserir > Código QR — geração direta sem plugin
- **Export for Web**: otimiza PNG/JPEG mantendo o perfil sRGB correto para digital
