# Backlog de KPIs — priorização para implementação

Backlog derivado do blueprint "Dashboards GitLab + Power BI" (acompanhamento ágil) comparado com o estado atual do `kpi-dashboard`.

**Critério de entrada de um KPI** (todos devem ser "sim"):

1. O dado existe no Supabase hoje? (senão → trabalho de pipeline)
2. Alguém decide algo olhando para ele? (senão → decoração)
3. A definição é honesta e não ambígua? (lead time ≠ cycle time; velocity exige story points)

**Legenda de status do dado:**

- 🟢 **Já tem** — dado no Supabase e exibido (ou trivial de exibir)
- 🟡 **Pronto p/ front** — dado existe no Supabase, falta só a UI
- 🔵 **Precisa pipeline** — exige nova coleta/sync (histórico de board, MRs, CI)
- ⚪ **Não aplicável** — exige fonte externa (ERP, horas, story points) — fora de escopo atual

**Esforço:** P (≤1d) · M (2–4d) · G (≥1 semana)

---

## Onda 1 — Quick wins (dado já existe, só falta UI)

Foco: PO + Qualidade, onde o MGI já lidera. Sem tocar no pipeline.

| # | KPI / visualização | Persona | Status | Esforço | Observação |
|---|--------------------|---------|--------|---------|------------|
| 1 | Heatmap **prioridade × módulo** | PO | 🟡 | M | Maior valor de priorização; usar `dashboard_aggregate_v2` cruzado ou nova RPC simples |
| 2 | Gráfico **Releases Git** | Executivo | 🟡 | P | `fetchReleases()` já existe e **não é exibido** em nenhuma página |
| 3 | Gráfico **Issues por Repositório** | Executivo/PO | 🟡 | P | Dimensão `repositorio` já existe na RPC |
| 4 | Card/alerta **Issues sem módulo** | Qualidade | 🟡 | P | Complementa `sem_tipo`; filtro `modulo = Não informado` |
| 5 | Alerta **Issues sem assignee** | Scrum/Qualidade | 🟡 | M | Pode exigir flag agregada; `assignee` já está em `issues` |
| 6 | **Backlog vencido** (idade > limite) destacado | Executivo | 🟡 | P | Já há `faixa_idade` e `sla_acima_90`; falta consolidar como KPI de topo |
| 7 | **Pareto de bugs por módulo** | Qualidade | 🟡 | M | Reusar backlog aberto por módulo filtrado por tipo = Bug |

**Entrega da onda:** ~1 semana, alto valor, risco baixo.

---

## Onda 2 — Valor operacional (ainda sem pipeline novo)

Foco: enriquecer páginas existentes com dados já sincronizados.

| # | KPI / visualização | Persona | Status | Esforço | Observação |
|---|--------------------|---------|--------|---------|------------|
| 8 | Página **Referência de Módulos** (14 módulos, variações, áreas, categoria) | Todos | 🟡 | M | Fonte: `REFERÊNCIA_RÁPIDA_MÓDULOS.csv` ou view; onboarding + "aba Lists" do Excel |
| 9 | Colunas manuais em `/issues`: `situacao_analise`, `desenvolvedor_futuro`, `observacao_geral`, `chamado`, `priorizar` | Operação | 🟡 | M | Campos existem na tabela `issues`, não aparecem na UI |
| 10 | Coluna/badge **confiança da área** (`confianca_area`) | Qualidade | 🟡 | M | Pipeline já grava; criar KPI "áreas a revisar" |
| 11 | **Throughput semanal** (fechadas por semana) | Scrum Master | 🟡 | M | Derivável de `fechado_em`; nova RPC de agregação semanal |
| 12 | **Ranking de entregas por dev** (fechadas) | Equipe | 🟡 | M | Cuidado: contextualizar por tipo/módulo p/ não virar métrica punitiva |
| 13 | **Carga aberta por dev** (WIP aproximado) | Equipe | 🟡 | M | Abertas por `desenvolvedor`/`assignee` |
| 14 | Link direto para a issue no **GitLab** na tabela | Operação | 🟡 | P | Montar URL a partir de `gitlab_repo` + `gitlab_iid` |

**Entrega da onda:** ~1–2 semanas.

---

## Onda 3 — Análise avançada de fluxo (exige pipeline)

Foco: Scrum Master real. Maior salto de valor, maior custo. **Bloqueado** por coleta de histórico de status/board.

| # | KPI / visualização | Persona | Status | Esforço | Pré-requisito |
|---|--------------------|---------|--------|---------|---------------|
| 15 | **Cumulative Flow Diagram (CFD)** | Scrum Master | 🔵 | G | Histórico de transições de status por data |
| 16 | **Cycle time** (início → conclusão) + scatter | Scrum Master | 🔵 | G | Timestamp de "em progresso", não só created/closed |
| 17 | **WIP médio / WIP por dev** | Scrum Master/Equipe | 🔵 | M | Estado "em progresso" estável + histórico |
| 18 | **Tempo de review de MR** (aberto → aprovado) | DevOps/Equipe | 🔵 | M | Sync de Merge Requests via API GitLab |
| 19 | **Reabertura de bugs (%)** | Qualidade | 🔵 | M | Histórico de reopen de issues |
| 20 | Alerta **volume crítico por módulo** (>N abertas) | Scrum/PO | 🟡 | P | Dado existe; regra de limite configurável |

**Decisão necessária antes de iniciar:** definir se o pipeline passará a coletar **eventos de issue/label/board** do GitLab (resource events API). Sem isso, 15–17 e 19 não saem.

---

## Onda 4 — DevOps / DORA (produto separado)

Foco: estabilidade de entrega. **Aba dedicada**, não misturar com dashboard de issues. Exige sync de pipelines/MRs.

| # | KPI | Persona | Status | Esforço | Pré-requisito |
|---|-----|---------|--------|---------|---------------|
| 21 | Deploys por semana | DevOps | 🔵 | M | API de pipelines/deployments GitLab |
| 22 | Lead time for changes | DevOps | 🔵 | G | Commit → deploy |
| 23 | Change failure rate (CFR) | DevOps | 🔵 | M | Marca de falha em deploy |
| 24 | MTTR | DevOps | 🔵 | M | Incidente → resolução |
| 25 | Pipelines OK / falha + tempo de build | DevOps | 🔵 | M | GitLab CI API |
| 26 | MRs abertos / aprovados | DevOps | 🔵 | M | Sync MRs |

---

## Onda 5 — PMO / não aplicável hoje

Fora do escopo de issues GitLab. Exigem ERP, apontamento de horas, ponto de função, estimativas.

| # | KPI | Status | Por quê |
|---|-----|--------|---------|
| 27 | SPI / CPI / Curva S | ⚪ | Precisa baseline de planejamento + custos |
| 28 | Horas planejadas × realizadas | ⚪ | Precisa timesheet/ERP |
| 29 | PF entregues / faturáveis / produtividade | ⚪ | Precisa contagem de ponto de função |
| 30 | Velocity / Burndown (story points) | ⚪ | Exige disciplina de estimativa em pontos |
| 31 | Entregas no prazo (%) | ⚪/🔵 | Precisa "prazo" formal (milestone/commitment de sprint) |
| 32 | Defeitos em produção | 🔵 | Possível se integrar coluna `chamado` a um sistema de chamados |

---

## Resumo executivo do backlog

| Onda | Itens | Status predominante | Janela sugerida |
|------|-------|---------------------|-----------------|
| 1 — Quick wins | 1–7 | 🟡 Pronto p/ front | Semana 1 |
| 2 — Operacional | 8–14 | 🟡 Pronto p/ front | Semanas 2–3 |
| 3 — Fluxo (Scrum) | 15–20 | 🔵 Precisa pipeline | Após decisão de coleta |
| 4 — DevOps | 21–26 | 🔵 Precisa pipeline | Produto/aba separada |
| 5 — PMO | 27–32 | ⚪ Não aplicável | Fora de escopo atual |

## Riscos a evitar (registrados)

1. **Velocity/Burndown sem story points** → número sem lastro.
2. **Lead time vs. cycle time** → não exibir como sinônimos; rotular claramente.
3. **Ranking por dev sem contexto** → risco de métrica punitiva; sempre segmentar por tipo/módulo.
4. **Prometer DevOps + PMO no mesmo release** → escopo infla e credibilidade cai.
5. **Heatmap/CFD bonitos sem decisão associada** → validar com PO/Scrum antes de construir.

## Próximo passo sugerido

Converter a **Onda 1** em issues no GitLab (1 issue por linha da tabela), com label `dashboard` + `kpi` e milestone "Dashboard – Onda 1". As ondas 3 e 4 entram como épicos bloqueados pela decisão de expandir a coleta do pipeline.
