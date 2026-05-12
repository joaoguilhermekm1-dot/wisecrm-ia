# Squad de Growth - WISE CRM IA

Objetivo: Gerar materiais de marketing e posicionamento estratégico baseados no código real e funcionalidades da plataforma.


## Agente 1: Pesquisador de Produto
- **Função:** Analisar as pastas `frontend/src/pages` e `backend/src/services` para identificar as funcionalidades mais valiosas que já estão implementadas.
- **Input:** Lista de arquivos do projeto.
- **Output:** Resumo técnico das 3 principais funcionalidades prontas para uso (ex: Dashboard de métricas Meta, Gestão de Leads, Automação de CRM).

## Agente 2: Copywriter Estratégico
- **Função:** Transformar os dados técnicos do Pesquisador em uma copy de alto impacto (LinkedIn post ou Landing Page section).
- **Input:** Resumo técnico do Agente 1.
- **Output:** 1 Post para LinkedIn seguindo o tom de voz "Direto, Profissional e Focado em ROI".

## Agente 3: Revisor de Conversão
- **Função:** Revisar o texto para evitar clichês, garantir que a proposta de valor está clara e que o Call to Action (CTA) é forte.
- **Input:** Copy do Agente 2.
- **Output:** Texto final revisado com sugestão de imagem/layout.

---
## Fluxo de Execução
Pesquisador de Produto -> Copywriter Estratégico -> Revisor de Conversão -> Output Final nos `docs/growth/`.
