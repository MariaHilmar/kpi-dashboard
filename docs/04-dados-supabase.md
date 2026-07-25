# Dados e Supabase

O schema Postgres versionado está em `supabase/migrations/` neste repositório. O dashboard consulta tabelas, views e RPCs; escrita controlada ocorre via **admin de usuários** e **importação Planning Poker** (service role no servidor).

## Migrations

| Arquivo | Conteúdo |
|---------|----------|
| `001_initial_schema.sql` | Tabelas base, views iniciais, RPCs legadas |
| `002_grants.sql` | Permissões para role `anon` |
| `003_kpis_completos.sql` | RPCs completas, `_issues_filtered`, paridade Excel |
| `004_issues_search.sql` | RPC `search_issues` |
| `005_modulo_area_pairs.sql` | View `v_modulo_area_pairs` |
| `006_schema_hardening.sql` | Funções auxiliares, hardening, `search_issues` revisada |
| `007_anon_least_privilege.sql` | Princípio do menor privilégio para anon |
| `008_profiles_admin.sql` | Perfis, papéis admin/user, RLS |
| `009_issues_search_filters.sql` | Filtros autor/período em `search_issues` |
| `010_analista_relatorios.sql` | Relatórios de analistas (rascunho/publicado) |
| `011_analista_relatorio_por_autor.sql` | Filtro Analistas por autor; `profiles.autor_issues` |
| `012_gitlab_identities.sql` | `gitlab_users`, `issue_participants`, IDs GitLab em `issues` e `profiles` |

Migrations **013–020** (analistas, alertas globais, faixa de idade, `search_issues`) estão na mesma pasta.

| Arquivo | Conteúdo |
|---------|----------|
| `021_search_issues_fechado_dates.sql` | Filtros de data de fechamento em `search_issues` |
| `022_search_issues_exige_parceria.sql` | Filtro exige parceria |
| `023_issues_entrega_prevista.sql` | Coluna `entrega_prevista` |
| `024_search_issues_status_order.sql` | Ordenação por status |
| `025_search_issues_entrega_order.sql` | Ordenação por entrega prevista |
| `026_flow_reports.sql` | Tabelas e RPCs base do relatório Kanban |
| `027_issue_status_events_pipeline.sql` | Tabela `issue_status_events` |
| `028_issue_status_events_upsert_constraint.sql` | Constraint upsert eventos |
| `029_flow_events_analytics.sql` | RPCs consumindo eventos de status |
| `030_flow_reports_security_definer.sql` | Hardening security definer |
| `031_flow_cfd_performance.sql` | Otimização CFD |
| `032_report_flow_stage_dwell.sql` | Tempo médio/mediano por etapa Kanban |
| `033_report_flow_data_quality.sql` | Cobertura eventos/snapshot/proxy |
| `034_milestone_report_schema.sql` | `milestones`, `milestone_issues`, campos Planning Poker em `issues` |
| `035_milestone_iid.sql` | `milestones.gitlab_milestone_iid` (número da URL GitLab) |

Schema consolidado gerado em `supabase/schema.sql` (script `supabase/generate_schema.ps1`).

---

## Tabelas principais

### `issues`

Espelho processado das issues GitLab (equivalente à aba **Dados** do Excel legado).

| Grupo de colunas | Exemplos |
|------------------|----------|
| Identificação | `issue_key`, `gitlab_iid`, `gitlab_repo`, `titulo` |
| Taxonomia | `modulo`, `modulo_normalizado`, `area_funcional`, `tipo`, `categoria` |
| Workflow | `estado`, `status`, `prioridade`, `equipe`, `parceria`, `sprint`, `epico` |
| Pessoas | `assignee`, `autor`, `desenvolvedor`, `solicitante` (texto para UI) |
| Identidades GitLab | `gitlab_author_id`, `gitlab_assignee_ids[]`, `gitlab_developer_id` |
| Datas / métricas | `criado_em`, `fechado_em`, `lead_time_dias`, `idade_dias`, `sla_mais_90_dias` |
| Git / Dev | `dev_tem_branch`, `dev_commits`, `dev_mergeado`, `gitlab_mrs` |
| Qualidade | `modulo_ok`, `area_ok`, `padrao_titulo`, `padrao_completo` |
| Colunas manuais (Excel) | `situacao_analise`, `desenvolvedor_futuro`, `observacao_geral`, `chamado`, `priorizar` |
| Relatório / Planning Poker | `story_points`, `aceita`, `justificada`, `historico`, `recorrente`, `horas_estimada`, `horas_prevista`, `homologado`, `ultimo_comentario`, `report_fields_synced_at` |
| Metadados | `synced_at`, `created_at`, `updated_at` |

**Chave única:** `issue_key` (composta pelo pipeline — ver `issue_keys.py`).

**Índices:** parceria, sprint, ano_criacao, modulo, area_funcional, repositorio, desenvolvedor, dev_mergeado, tipo, equipe, status, prioridade, epico.

### `releases`

Releases/tags Git sincronizadas pelo pipeline.

| Coluna | Descrição |
|--------|-----------|
| `repositorio`, `versao` | Chave única composta |
| `data_release` | Data da release |
| `rotulo` | Label exibido no gráfico |

### `sync_runs`

Histórico de execuções do sync Python.

| Coluna | Descrição |
|--------|-----------|
| `source` | Origem (ex.: `excel`, pipeline) |
| `rows_upserted`, `releases_upserted` | Contadores |
| `started_at`, `finished_at` | Timestamps |
| `status` | `running` \| `success` \| `error` |
| `message` | Detalhe opcional |

O header do dashboard consulta a última execução com `status = 'success'`.

### `gitlab_users`

Identidades GitLab (ID global, username, name, email). Escrita pelo pipeline; leitura autenticada.

### `issue_participants`

Vínculo issue ↔ usuário GitLab por papel: `author`, `assignee`, `developer`. Ver [10-identidades-gitlab.md](./10-identidades-gitlab.md).

### `profiles`

Contas do dashboard (Auth + metadados): `full_name`, `gitlab_user_id`, `role`, `active`, `autor_issues` (legado).

### `analista_relatorios`

Rascunhos/publicações de “outras atividades” na página Analistas.

### `milestones` / `milestone_issues` / `milestone_import_runs`

Catálogo de milestones GitLab, snapshot histórico issue × milestone e auditoria de importações. Ver [12-importar-dados.md](./12-importar-dados.md).

### `issue_status_events` / `issue_status_snapshots`

Histórico de transições de label `status::` e snapshots diários — base do relatório Kanban. Ver [11-relatorio-fluxo.md](./11-relatorio-fluxo.md).

## Views

| View | Uso no dashboard |
|------|------------------|
| `v_filter_options_full` | Opções de todos os filtros globais (arrays agregados) |
| `v_modulo_area_pairs` | Pares módulo × área para filtros dependentes |
| `v_kpis` | KPIs simples (legado; substituída por RPC) |
| `v_filter_options` | Opções básicas (legado) |

## RPCs consumidas pelo dashboard

Mapeamento `lib/dashboard/fetchers.ts` → Postgres:

| RPC | Função fetcher | Descrição |
|-----|----------------|-----------|
| `dashboard_kpis_full` | `fetchKpis` | 11 KPIs consolidados com filtros |
| `dashboard_aggregate_v2` | `fetchAggregate` | Contagem por dimensão |
| `dashboard_fluxo_mensal` | `fetchFluxoMensal` | Criados/fechados/backlog por mês |
| `dashboard_lead_time_por_modulo` | `fetchLeadTimePorModulo` | Lead médio/mediano por módulo |
| `dashboard_kpis_por_tipo` | `fetchKpisPorTipo` | KPIs segmentados por tipo |
| `dashboard_top_lead_times` | `fetchTopLeadTimes` | Maiores lead times |
| `dashboard_alertas_resumo` | `fetchAlertasResumo` | Contagem alertas globais |
| `dashboard_alertas_por_modulo` | `fetchAlertasPorModulo` | Alertas agrupados por módulo |
| `dashboard_faixa_idade` | `fetchFaixaIdade` | Distribuição por faixa de idade |
| `search_issues` | `searchIssues` | Busca paginada de issues |
| `analista_relatorio_snapshot` | `fetchAnalistaRelatorioSnapshot` | KPIs/issues Analistas (`p_gitlab_user_id` ou `p_autor`) |
| `report_flow_cfd` | `flow-report.ts` | CFD diário |
| `report_flow_throughput` | idem | Throughput por período |
| `report_flow_lead_time_detail` / `_agg` | idem | Lead time e cycle time |
| `report_flow_work_item_age` | idem | Idade de work items abertos |
| `report_flow_wip` | idem | WIP por etapa |
| `report_flow_bottlenecks` | idem | Gargalos heurísticos |
| `report_flow_stage_dwell` | idem | Tempo por etapa Kanban |
| `report_flow_data_quality` | idem | Cobertura histórico real vs proxy |
| `report_milestone_commitment` | `milestone-report.ts` | Comprometido vs entregue por sprint |
| `report_milestone_issues` | idem | Tabela operacional milestone (filtros committed/delivered/not_delivered/wip) |

Detalhes das RPCs de fluxo: [11-relatorio-fluxo.md](./11-relatorio-fluxo.md).  
Relatório milestone: [13-relatorio-milestone.md](./13-relatorio-milestone.md).

### Dimensões de `dashboard_aggregate_v2`

Definidas em `lib/dashboard/constants.ts` → `AGGREGATE_DIMENSIONS`:

```
status, tipo, prioridade, modulo, equipe, parceria, repositorio,
area_funcional, categoria, desenvolvedor, dev_mergeado,
qualidade_modulo_ok, qualidade_area_ok, qualidade_padrao_titulo,
qualidade_padrao_completo
```

Parâmetros adicionais: `p_limit`, `p_only_abertas`.

### Função interna `_issues_filtered`

Base de quase todas as RPCs filtradas. Aceita 16 parâmetros opcionais (ver [filtros](./03-paginas-funcionalidades.md#filtros-globais)).

Regras especiais:

- `p_* = 'Todos'` ou `null` → dimensão ignorada.
- `p_* = 'Não informado'` → filtra registros com campo vazio/trim vazio.
- `p_ano = 0` → ignorado (tratado como null).

### `search_issues`

Parâmetros (além dos filtros comuns):

| Parâmetro | Descrição |
|-----------|-----------|
| `p_search` | Texto livre (título, autor, assignee, ID) |
| `p_estado` | `Todos` \| `open` \| `closed` |
| `p_sla` | `Todos` \| `acima_90` |
| `p_order` | Coluna/direção de ordenação |
| `p_limit` | Tamanho da página (50) |
| `p_offset` | Offset para paginação |

Retorno inclui `total_count` na primeira coluna de cada linha para calcular páginas.

## Contrato de filtros (TypeScript)

Tipo `DashboardFilters` em `types/database.ts`:

```typescript
{
  modulo, area, tipo, prioridade, equipe, status,
  parceria, sprint, epico, repositorio, situacao,
  ano: number | null,
  criadoDe, criadoAte, fechadoDe, fechadoAte: string | null
}
```

Tradução para RPC via `commonArgs()` + `dateArgs()` em `lib/dashboard/filters.ts`.

## KPIs retornados por `dashboard_kpis_full`

| Campo | Descrição |
|-------|-----------|
| `total` | Issues no recorte filtrado |
| `abertas` / `fechadas` | Por flag booleana |
| `taxa_fechamento` | Percentual |
| `lead_time_medio` | Média em dias (issues fechadas) |
| `bugs_abertos` | Bugs com estado aberto |
| `melhorias_abertas` | Melhorias abertas |
| `sem_tipo` | Issues sem tipo inferido |
| `pct_bugs_backlog` | % de bugs entre abertas |
| `taxa_fech_bug` | Taxa de fechamento de bugs |
| `sla_acima_90` | Issues abertas há mais de 90 dias |

## Origem dos dados (pipeline)

O pipeline Python deriva campos antes do upsert:

| Campo Supabase | Módulo pipeline |
|----------------|-----------------|
| modulo, area_funcional, tipo | `taxonomy.py`, detectores Git |
| lead_time_dias, idade_dias, sla | `issue_fields.py` |
| dev_mergeado, dev_commits | `enriquecer_dev_git.py` |
| gitlab_author_id, gitlab_* , issue_participants | `gitlab_identities.py` + `sync_supabase.py` |
| modulo_ok, padrao_* | regras de qualidade em `taxonomy.py` |
| parceria, sprint | labels / milestone GitLab |
| epico | vinculo GitLab (`issue.epic`), label `Épico::`/`Epico::`, ou catalogo `gitlab_epics` (filtro) |

Ver `mgi-kpi-pipeline/README.md` para detalhes de processamento.

## Aplicar schema no Supabase

1. Criar projeto em [supabase.com](https://supabase.com).
2. Executar migrations **em ordem** (001 → 035) no SQL Editor ou via Supabase CLI.
3. Copiar URL, anon key e service role key.
4. Atualizar issues do GitLab e sincronizar:

```powershell
cd seu-workspace\mgi-kpi-pipeline
python atualizar_gitlab_issues.py --full
python sync_supabase.py
python backfill_profile_gitlab_ids.py
```

Ver [10-identidades-gitlab.md](./10-identidades-gitlab.md).

## Sincronização

Após cada sync bem-sucedido:

- Tabela `issues` recebe upsert por `issue_key` (inclui `gitlab_author_id`, etc.).
- Tabelas `gitlab_users` e `issue_participants` atualizadas a cada sync.
- Tabela `releases` recebe upsert por `(repositorio, versao)`.
- `sync_runs` registra contadores e timestamp.

O dashboard exibe `finished_at` da última sync com sucesso no header.

### Invalidação de cache do dashboard

Após sync, o pipeline (`sync_supabase.py`) pode chamar o endpoint de revalidação:

```
POST https://<dashboard-url>/api/revalidate
Authorization: Bearer <REVALIDATE_SECRET>
```

Resposta esperada: `{ "revalidated": true, "tag": "kpis" }`.

Isso invalida o cache de dados (`unstable_cache`) usado pelos fetchers — incluindo KPIs, agregações, opções de filtro (`fetchFilterOptions`) e última sync (`fetchLastSync`). Sem essa chamada, o dashboard continua servindo dados cacheados até o TTL de 24 h expirar.

Variáveis necessárias:

| Variável | Onde | Descrição |
|----------|------|-----------|
| `REVALIDATE_SECRET` | Dashboard + pipeline | Segredo compartilhado (Bearer token) |
| `DASHBOARD_URL` | Pipeline | URL de produção do dashboard |
