# Photoshop — Referência Técnica Avançada

## Atalhos Essenciais (que separam profissionais de amadores)

| Ação | Atalho |
|------|--------|
| Ocultar/mostrar guias | Ctrl+; |
| Recortar no lugar (Clip Mask) | Ctrl+Alt+G |
| Mesclar camadas visíveis numa nova | Ctrl+Shift+Alt+E |
| Transformar livremente | Ctrl+T |
| Desfazer múltiplos passos | Ctrl+Alt+Z |
| Preencher com cor de frente/fundo | Alt+Del / Ctrl+Del |
| Seleção por cor | W (Magic Wand) ou Shift+Ctrl+Alt+R (Select Subject) |
| Mover entre camadas | Alt+[ / Alt+] |
| Ativar/desativar olho de camada | Alt+Click no olho |

---

## Técnicas Avançadas por Área

### Retoque de Pele (Frequência Separada)
1. Duplique a camada duas vezes → nomeie "Baixa Frequência" e "Alta Frequência"
2. Na camada "Baixa Frequência": aplique **Filtro > Desfoque > Desfoque Gaussiano** (~8-12px)
3. Na camada "Alta Frequência": vá em **Imagem > Aplicar Imagem**
   - Camada: Baixa Frequência | Modo: Subtrair | Escala: 2 | Deslocamento: 128
4. Mude o modo de mesclagem da Alta Frequência para **Luz Linear**
5. Retoques de tom/cor → na Baixa | Retoques de textura/poros → na Alta

### Mascaramento de Cabelo (método profissional)
1. Vá em **Selecionar > Sujeito** para seleção inicial
2. Clique em **Selecionar e Mascarar** (Select and Mask)
3. Use o **Pincel de Refinamento de Borda** (E) nas bordas de cabelo
4. Em Saída: selecione **Nova Camada com Máscara de Camada**
5. Para fios soltos: use **Canais** — identifique o canal com mais contraste (geralmente Azul), duplique, pinte de preto/branco e carregue como seleção

### Composição Fotorealista (regras de luz)
- **Match de luz**: a luz do elemento inserido deve vir da mesma direção da cena
- Use **Sobreposição de Cor** (Color Overlay) para "coletar" a cor de luz ambiente e aplicar sutilmente no elemento
- Adicione uma camada de **Sombra** com Elipse desfocada (Gaussian Blur ~25-40px), opacidade ~40-60%, modo **Multiplicar**
- Use **Filtro de Câmera RAW** para equalizar temperatura de cor entre elementos

### Smart Objects — Workflow Não Destrutivo
- Sempre converta camadas importantes em **Objeto Inteligente** (Ctrl+Click direito > Convert to Smart Object)
- Filtros aplicados em Smart Objects são editáveis a qualquer momento
- Crie **Libraries** (Bibliotecas) para reutilizar elementos entre documentos
- Use **Linked Smart Objects** para atualizar assets em vários arquivos de uma vez

### Ações e Automação
- Grave **Ações** (Window > Actions) para tarefas repetitivas (redimensionar, exportar, aplicar efeito)
- Use **Processamento em Lote** (File > Automate > Batch) para aplicar ações em pastas inteiras
- **Droplets**: transforme uma ação em um programa executável que processa arquivos arrastados

---

## Configurações de Exportação por Mídia

### Para Web/Digital (Instagram, Facebook, Site)
- Formato: **JPEG** (qualidade 80-90%) ou **PNG** (quando precisa de transparência)
- Espaço de cor: **sRGB**
- Resolução: **72 DPI** (ou 150 DPI para telas Retina)
- Exportar via: **File > Export > Export As** (nunca "Save for Web" — está obsoleto)

### Para Impressão (gráfica, offset)
- Formato: **TIFF** (sem compressão) ou **PDF** com sangria
- Espaço de cor: **CMYK** (configure no início do projeto!)
- Resolução: **300 DPI** mínimo (para outdoor: 72 DPI é suficiente por ser visto de longe)
- Sangria: **3mm** em todos os lados
- Margens de segurança: **5mm** para dentro da borda

### Para Bordado/Corte a Laser/Sublimação
- Converta para vetor no Illustrator antes
- Para sublimação: espelhe a imagem horizontalmente antes de imprimir

---

## Erros Comuns e Como Evitar

| Erro | Solução |
|------|---------|
| Trabalhar em RGB para impressão | Sempre configure CMYK ao criar documento para impressão |
| Usar JPEG como camada de edição | Importe como Smart Object; nunca rasterize antes de terminar |
| Dimensão em pixels errada | Calcule: cm × (DPI/2.54). Ex: 10cm a 300DPI = 1181px |
| Perder qualidade ao redimensionar | Use "Preservar Detalhes 2.0" ao aumentar imagens |
| Cores diferentes na impressão | Peça o perfil ICC da gráfica e instale antes de provar cores |

---

## Recursos Pro que Poucos Usam

- **Pen Tool com Auto Add/Delete**: mantendo a tecla habilitada, a caneta adiciona ou remove pontos automaticamente ao clicar numa path
- **Heal Selection em preenchimento**: Editar > Preencher > Conteúdo Ciente (Content-Aware Fill) — remove objetos como mágica
- **Sky Replacement** (Photoshop 2021+): Editar > Substituição de Céu — IA troca o céu com ajuste automático de luz
- **Neural Filters**: Filtro > Neural Filters — suavização de pele, colorização de fotos antigas, expressão facial
- **Warp Text**: no painel de Texto, "Criar Texto Deformado" — texto em arco, onda, perspectiva
