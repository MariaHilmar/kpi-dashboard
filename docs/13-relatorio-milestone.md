# Relatório Milestone (sprint)

> **Oculto no produto MGI.** As rotas `/milestone`, `/milestone/roadmap` e `/sprint` não entram no menu e o acesso direto redireciona para a home. Motivo: **não seriam utilizadas na MGI**. O código permanece neste repositório.

Página `/milestone` - relatório operacional por milestone GitLab (Sprint 89, 90, 91…).

Depende de:

- Migrations `034`–`035` (schema + IID)
- Import GitLab / Planning Poker ([12-importar-dados.md](./12-importar-dados.md))
- Issue #23 — página base com seletor de sprint

## RPCs por sprint

| RPC | Uso | Issue |
|-----|-----|-------|
| `report_milestone_summary` | Headline WIP + totais (legado; commitment migrado para RPC dedicada) | #27 |
| `report_milestone_commitment` | KPI comprometido vs entregue | #32 |
| `report_milestone_wip` / `report_milestone_mix` | WIP por etapa + mix dimensional | #34 |
| `report_milestone_burndown` | Burndown / burnup diário | #31 |
| `report_milestone_throughput` | Throughput intra-sprint | #33 |
| `report_milestone_issues` | Tabela operacional paginada | #27 |
| `report_milestone_delivery_by_dimension` | Entrega por dimensão | #36 |
| `report_flow_*` (escopo milestone) | Lead time / dwell | #35 |

## Comprometido vs entregue (#32)

### Definições

| Métrica | Fonte |
|---------|--------|
| Comprometido (issues) | `count(*)` em `milestone_issues` no import |
| Comprometido (pontos) | `sum(story_points)` em `milestone_issues` |
| Entregue | Issues com `fechado_em::date` ∈ `[start_date, due_date]` e presentes na milestone |
| Não entregue (carry) | Complemento: abertas, fechadas fora da janela ou sem `fechado_em` |
| Taxa entrega | entregue ÷ comprometido × 100 |

### UI

- Seção **Comprometido vs entregue** — KPI cards, barra comparativa (issues + story points quando disponível)
- Drill-down **Issues não entregues** — preview + link para tabela com `issues_metric=not_delivered`
- Story points: exibe **N/A** quando nenhum registro tem `story_points` no snapshot (`has_story_points = false`)
- **Tendências entre sprints** (final da página `/sprint` — Sprint Atual, e também `/milestone`) — heatmap equipe × sprint, gráfico de linha e filtros; janela padrão = sprint anterior → sprint selecionada
- Página dedicada `/milestone/tendencias` — mesma capacidade por equipe com janela padrão de 12 sprints

### Timezone e datas de entrega {#timezone-e-datas-de-entrega}

Regra aplicada em `report_milestone_commitment` e filtros `delivered` / `not_delivered` de `report_milestone_issues`:

1. **`milestones.start_date` / `due_date`** — tipo `date`, conforme GitLab (sem horário).
2. **`fechado_em`** — `timestamptz` sincronizado do GitLab/pipeline.
3. **Comparação de entrega** — `fechado_em::date` (data civil no fuso da sessão Postgres).

No Supabase Cloud a sessão padrão é **UTC**. Exemplo: fechamento às 22:00 em Brasília (UTC−3) do dia 17/01 grava `2026-01-18T01:00:00Z` → `fechado_em::date` = **2026-01-18** (dia UTC), podendo contar como entrega **fora** da janela se `due_date = 2026-01-17`.

**Validação manual (Sprint 90):** conferir totais ± issues marcadas Fechado sem `fechado_em` preenchido (alerta na UI quando `missing_close_date_issues > 0`).

**Futuro (se necessário):** migrar comparação para `fechado_em AT TIME ZONE 'America/Sao_Paulo'::date` — hoje mantemos UTC por consistência com demais RPCs de fluxo (`fechado_em::date`).

### Migration

`047_report_milestone_commitment.sql` — RPC `report_milestone_commitment` + métrica `not_delivered` em `report_milestone_issues`.
