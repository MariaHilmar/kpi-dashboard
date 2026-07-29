# Relatório de fluxo / Kanban

Relatório gerencial de fluxo baseado nas issues sincronizadas do GitLab (`public.issues`). **Não utiliza Story Points nem estimativas.**

## Endpoints REST

Autenticação: sessão Supabase (mesmo padrão das demais rotas `/api/*`).

| Endpoint | Descrição |
|---|---|
| `GET /api/reports/flow/cfd` | Diagrama de Fluxo Cumulativo (série diária) |
| `GET /api/reports/flow/throughput` | Issues concluídas por semana ou mês |
| `GET /api/reports/flow/lead-time` | Detalhe + agregação (média, mediana, P85) |
| `GET /api/reports/flow/work-item-age` | Idade das issues em andamento (Top N) |
| `GET /api/reports/flow/wip` | WIP atual por etapa |
| `GET /api/reports/flow/bottlenecks` | Possíveis gargalos por etapa |
| `GET /api/reports/flow/stage-dwell` | Tempo médio/mediano por etapa Kanban (histórico) |
| `GET /api/reports/flow/data-quality` | Cobertura eventos vs snapshot vs proxy no recorte |

### Parâmetros de filtro

| Parâmetro API | Campo na base | Observação |
|---|---|---|
| `project_id` | `repositorio` / `gitlab_repo` | Não existe `project_id` numérico |
| `module` | `modulo` | |
| `milestone` | `sprint` | Milestone GitLab → coluna `sprint` |
| `assignee` | `assignee`, `desenvolvedor`, `issue_participants` | Busca parcial |
| `start_date`, `end_date` | Período de análise | CFD, throughput, lead time, stage dwell, data quality |
| `modulo`, `area`, `tipo`, … | Igual dashboard executivo | Via `parseFilters` |

Parâmetros adicionais:

- `granularity=week|month` — throughput e agregações de lead time
- `limit` — work-item-age (default: 10)

### Formato de resposta

```json
{
  "filters": { "start_date": "2026-06-01", "end_date": "2026-06-30" },
  "approximations": { "cfd": "...", "leadTimeStart": "..." },
  "data": []
}
```

## Etapas Kanban

Mapeamento em `flow_map_etapa` (SQL) e `lib/dashboard/flow-stages.ts`:

| Etapa gerencial | Labels GitLab (`status::`) |
|---|---|
| Backlog | Backlog, Aberta, vazio |
| A Fazer | Sprint Atual, A Fazer, Todo |
| Em Desenvolvimento | Doing, Em Andamento |
| Em Teste | Em Revisão, Teste, QA |
| Homologação | Homologação, UAT, HML |
| Concluído | Delivered, Done, estado Fechado |
| Cancelado | Cancelado, Recusado (excluído do WIP) |

## Regras de cálculo por indicador

### 1. CFD

- **Dataset:** `data_referencia`, `etapa`, `quantidade`
- **RPC:** `report_flow_cfd`
- **Regra:** Para cada dia do período, conta issues ativas (criadas e ainda não fechadas naquele dia).
- **Prioridade:** `issue_status_events` → `issue_status_snapshots` → proxy (`flow_etapa_on_date`).
- **Proxy (fallback):** Status atual entre `criado_em` e `fechado_em`; após `fechado_em` → Concluído.

### 2. Throughput

- **Dataset:** `periodo`, `quantidade_concluida`
- **RPC:** `report_flow_throughput`
- **Conclusão:** `fechado_em` preenchido no intervalo (estado Fechado no pipeline).

### 3. Lead Time e Cycle Time

- **Lead time:** `criado_em` → `fechado_em` (campo `lead_time_dias`)
- **Cycle time:** 1ª entrada em A Fazer/Em Desenvolvimento (`issue_status_events`) → `fechado_em` (campo `cycle_time_dias`)
- **Agregação:** média, mediana e percentil 85 por semana/mês de conclusão (sobre lead time)
- **RPCs:** `report_flow_lead_time_detail`, `report_flow_lead_time_agg`

### 4. Work Item Age

- **Fórmula:** `current_date − flow_data_inicio_cycle` (1ª entrada A Fazer/Dev, fallback `criado_em`)
- **Escopo:** Issues abertas, excluindo Concluído/Cancelado
- **Top 10:** endpoint `work-item-age?limit=10`

### 5. WIP

- Etapas: A Fazer, Em Desenvolvimento, Em Teste, Homologação
- Exclui Backlog, Concluído, Cancelado

### 6. Gargalos

- Combina WIP atual + idade média/máxima por etapa
- Observações heurísticas (desenvolvimento retenção, validação, volume alto)

### 7. Tempo por etapa (dwell)

- **Dataset:** `etapa`, `tempo_medio_dias`, `tempo_mediano_dias`, `quantidade_issues`
- **RPC:** `report_flow_stage_dwell`
- **Escopo:** Issues **concluídas** no período (`fechado_em` no intervalo), com filtros globais e de fluxo
- **Etapas:** Backlog, A Fazer, Em Desenvolvimento, Em Teste, Homologação (exclui Concluído/Cancelado)
- **Cálculo:** Soma dias por segmento reconstruído em `flow_etapa_segments` (`issue_status_events`); mediana e média calculadas **por issue** e depois agregadas por etapa (SQL `percentile_cont`)
- **Proxy:** Issues sem eventos no GitLab — todo o lead time é atribuído à etapa final mapeada (`flow_map_etapa`); contagem exposta em `issues_com_proxy`
- **Diferença:** Não confundir com lead time médio por módulo em `/detalhamento` (dimensão repositório/módulo, não coluna Kanban)

### 8. Qualidade do histórico (rodapé `/fluxo`)

- **Dataset:** `total_issues`, `com_eventos`, `com_snapshot_apenas`, `com_proxy`, percentuais
- **RPC:** `report_flow_data_quality`
- **Escopo:** Issues **ativas no período** — mesmo recorte do CFD (`p_active_in_period`)
- **Classificação mutuamente exclusiva:** eventos GitLab → snapshot diário no período → proxy (`flow_etapa_on_date`)
- **UI:** `FluxoDataQualityFooter` — ex.: `98% histórico real · 2% aproximação (proxy)`
- **Diferença:** Não confundir com `/qualidade` (conformidade de preenchimento de campos)

## Campos ausentes e impacto

| Campo ausente | Impacto | Alternativa atual | Ajuste recomendado no coletor |
|---|---|---|---|
| Histórico de transições de `status` | CFD e tempo por etapa imprecisos no passado | Status atual + datas | Coletar GitLab **Resource Label Events** (`/projects/:id/issues/:iid/resource_label_events`) |
| `status_entered_at` | Lead time por etapa indisponível | — | Derivar de eventos ou snapshots |
| `milestone_id`, datas de sprint | Filtro milestone ok; sem ciclo de sprint | Coluna `sprint` (título) | Persistir metadados do milestone |
| `project_id` GitLab | API usa `repositorio`/`gitlab_repo` | Nome/slug do repo | Adicionar `gitlab_project_id` |
| Labels brutas | Sem filtro por label arbitrária | Colunas derivadas (`tipo`, `status`, …) | Coluna `labels text[]` ou JSONB |
| Story Points | Não usados (requisito) | — | — |

## Coleta incremental (a partir de agora)

1. **Snapshots diários:** automático no `pipeline_maestro.py` após sync (agendamento diário)
   - Script manual: `python kpi-pipeline/snapshot_issue_status.py`
   - RPC `flow_capture_daily_snapshots`
   - Tabela `issue_status_snapshots`

2. **Eventos (coleta implementada):** tabela `issue_status_events` — ver `kpi-pipeline/docs/06-status-events.md`
   - Pipeline: `sync_supabase.py` + `backfill_status_events.py`
   - API GitLab: `resource_label_events` (labels `status::`)

## Performance

- CFD com cross join dia × issue pode ser pesado em bases grandes (>5k issues × 90 dias).
- **Recomendação:** limitar período na API; executar snapshot diário; considerar materializar em `flow_cfd_cache` (tabela preparada na migration 026).

## Migration

- `supabase/migrations/026_flow_reports.sql` — tabelas e RPCs base
- `supabase/migrations/029_flow_events_analytics.sql` — RPCs consumindo `issue_status_events`
- `supabase/migrations/032_report_flow_stage_dwell.sql` — dwell time por etapa Kanban
- `supabase/migrations/033_report_flow_data_quality.sql` — cobertura eventos/snapshot/proxy
- `supabase/migrations/034_milestone_report_schema.sql` — campos Planning Poker em `issues` (não usados pelo CFD)
- `supabase/migrations/035_milestone_iid.sql` — IID do milestone na URL GitLab

## Testes

```bash
cd kpi-dashboard
npm test -- tests/lib/flow-stages.test.ts tests/lib/flow-report.test.ts tests/lib/flow-charts.test.ts
```

**Última atualização da documentação:** 2026-07-03

## Página do dashboard

Rota: **`/fluxo`** — menu **Análise → Fluxo Kanban**.

Componentes em `components/dashboard/fluxo/`; dados via `lib/dashboard/flow-report.ts` (RPCs live).
