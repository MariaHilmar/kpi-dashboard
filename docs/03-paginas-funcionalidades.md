# Páginas e funcionalidades

## Navegação

A navegação é definida em `lib/navigation.ts` e reutilizada pela `Sidebar` (desktop) e `MobileNav`.

| Grupo | Rota | Label | Descrição |
|-------|------|-------|-----------|
| Visão geral | `/` | Executivo | KPIs e visão consolidada |
| Visão geral | `/alertas` | Alertas | Sem épico/parceria + idade |
| Análise | `/temporal` | Análise Temporal | Criados × fechados × backlog |
| Análise | `/detalhamento` | Detalhamento | Parceria, área, lead time, KPI por tipo |
| Análise | `/qualidade` | Qualidade | Conformidade de preenchimento |
| Operação | `/sprint` | Sprint Atual | Visão focada no sprint selecionado |
| Operação | `/equipes` | Equipes & Devs | Volume, devs, merge em master |
| Dados | `/issues` | Issues | Busca livre + tabela paginada |

---

## `/` — Dashboard Executivo

**Arquivo:** `app/(dashboard)/page.tsx`

**Objetivo:** visão consolidada equivalente ao Dashboard Executivo do Excel.

A página usa **streaming por seção**: cada bloco é um Server Component async dentro de `<Suspense>`, renderizado independentemente conforme o fetch termina. Componentes em `components/dashboard/executivo/`.

### Conteúdo

| Bloco | Componente | Fonte de dados | RPC / dimensão |
|-------|------------|----------------|----------------|
| Grade de KPIs (10 cards) | `KpiSection` | `fetchKpis` | `dashboard_kpis_full` |
| Evolução mensal | `FluxoMensalSection` | `fetchFluxoMensal` | `dashboard_fluxo_mensal` |
| Donut Status / Tipo / Bar Prioridade | `DistribuicaoSection` | `fetchAggregate` | `dashboard_aggregate_v2` |
| Bar Módulos / Equipes (top 14) | `VolumeSection` | `fetchAggregate` | idem |

### KPIs exibidos

| KPI | Campo |
|-----|-------|
| Total filtrado | `total` |
| Fechadas | `fechadas` |
| Abertas | `abertas` |
| Taxa de fechamento | `taxa_fechamento` |
| Lead time médio | `lead_time_medio` (dias) |
| Bugs abertos | `bugs_abertos` |
| Melhorias abertas | `melhorias_abertas` |
| Sem tipo | `sem_tipo` |
| % Bugs no backlog | `pct_bugs_backlog` |
| Taxa fech. Bug | `taxa_fech_bug` |

---

## `/alertas` — Alertas

**Arquivo:** `app/(dashboard)/alertas/page.tsx`

**Objetivo:** identificar issues problemáticas (metadados incompletos, idade, lead time extremo).

| Componente | Fonte |
|------------|-------|
| Resumo (abertas, sem épico, sem parceria) | `dashboard_alertas_resumo` |
| Tabela sem Épico por módulo | `dashboard_alertas_por_modulo('sem_epico')` |
| Tabela sem Parceria por módulo | `dashboard_alertas_por_modulo('sem_parceria')` |
| Faixa de idade | `dashboard_faixa_idade` |
| Top lead times | `dashboard_top_lead_times` (top 20, filtro ano) |

> Alertas de resumo e faixa de idade **não** aplicam filtros globais — refletem o universo de issues abertas no banco.

---

## `/temporal` — Análise Temporal

**Arquivo:** `app/(dashboard)/temporal/page.tsx`

Dois gráficos de fluxo mensal com os mesmos dados:

1. **Criados × Fechados** — volume mensal.
2. **Backlog líquido acumulado** — diferença criados − fechados por mês.

Fonte: `dashboard_fluxo_mensal` (respeita filtros globais).

---

## `/detalhamento` — Detalhamento

**Arquivo:** `app/(dashboard)/detalhamento/page.tsx`

| Visualização | Dimensão / RPC | Limite |
|--------------|----------------|--------|
| Parcerias | `parceria` | — |
| Issues por Módulo | `modulo` | top 14 |
| Área Funcional | `area_funcional` | top 14 |
| Categoria Funcional | `categoria` | — |
| Lead time médio por módulo | `dashboard_lead_time_por_modulo` | top 15 |
| Tabela KPI por tipo | `dashboard_kpis_por_tipo` | todos os tipos |

Categorias funcionais esperadas: Core, Compliance, Finance, Platform, Operations.

---

## `/qualidade` — Qualidade dos Dados

**Arquivo:** `app/(dashboard)/qualidade/page.tsx`

Espelha a aba/gráfico **Qualidade dos Dados** do Excel.

| Métrica | Origem |
|---------|--------|
| Sem tipo, % bugs backlog, SLA > 90d | `dashboard_kpis_full` |
| Gráfico conformidade (4 barras "Sim") | agregações `qualidade_*` via `fetchQualidade` |
| Backlog aberto por módulo | `modulo` com `onlyAbertas: true` |

Flags de qualidade na tabela `issues`:

- `modulo_ok`, `area_ok`, `padrao_titulo`, `padrao_completo`

---

## `/sprint` — Sprint

**Arquivo:** `app/(dashboard)/sprint/page.tsx`

Visão operacional do sprint selecionado nos **filtros globais**. Se `sprint === "Todos"`, exibe aviso para selecionar uma sprint.

Conteúdo: `KpiGrid` + donuts Status/Tipo + barra Equipes — todos filtrados pela sprint escolhida.

---

## `/equipes` — Equipes & Desenvolvedores

**Arquivo:** `app/(dashboard)/equipes/page.tsx`

| Gráfico | Dimensão | Limite |
|---------|----------|--------|
| Volume por Equipe | `equipe` | top 20 |
| Top Desenvolvedores | `desenvolvedor` | top 12 |
| Merge em master | `dev_mergeado` | — |

Dados de desenvolvedor e merge vêm do enriquecimento Git feito pelo pipeline (`enriquecer_dev_git.py`). Identidades GitLab (autor, assignee, dev) são persistidas em `gitlab_*` e `issue_participants` — ver [10-identidades-gitlab.md](./10-identidades-gitlab.md).

---

## `/analistas` — Relatório de atividades

**Arquivo:** `app/(dashboard)/analistas/page.tsx`

Relatório mensal por analista: KPIs, distribuição por módulo/parceiro, lista de issues e editor de “outras atividades”.

### Filtro de issues do analista

1. **Preferencial:** `profiles.gitlab_user_id` → issues onde `gitlab_author_id` coincide (RPC `analista_relatorio_snapshot` com `p_gitlab_user_id`).
2. **Legado:** nome em `issues.autor` vs `profiles.full_name` ou `autor_issues`.

Gestores (admin) podem filtrar por autor na URL; cada analista edita apenas suas outras atividades quando o filtro corresponde ao próprio perfil.

Export: `GET /api/analistas/export`.

---

## `/conta` — Minha conta

**Arquivo:** `app/(dashboard)/conta/page.tsx`

- Alterar **nome de exibição** (`profiles.full_name`)
- Alterar **senha** (Supabase Auth)

---

## `/admin/usuarios` — Administração de usuários

Somente **admin**. CRUD de contas, inclusive **ID GitLab** e nome de exibição. Ver [09-admin-usuarios.md](./09-admin-usuarios.md).

---

## `/issues` — Listagem de Issues

**Arquivo:** `app/(dashboard)/issues/page.tsx`

### Funcionalidades

- Busca livre (`q`) por título, autor, responsável ou ID.
- Filtros locais: **estado** (`Todos` | `open` | `closed`), **SLA** (`Todos` | `acima_90`).
- Ordenação configurável (`order`, padrão `criado_em_desc`).
- Paginação: **50 issues por página** (`ISSUES_PAGE_SIZE`).
- Respeita **todos os filtros globais** da URL.

### RPC

`search_issues` — retorna linhas + `total_count` para paginação.

### Colunas exibidas

gitlab_iid, gitlab_repo, titulo, modulo, area_funcional, tipo, estado, status, prioridade, equipe, parceria, sprint, epico, desenvolvedor, assignee, criado_em, fechado_em, lead_time_dias, idade_dias, sla_mais_90_dias.

---

## Filtros globais

Componente: `components/layout/GlobalFilters.tsx`

| Parâmetro URL | Dimensão |
|---------------|----------|
| `modulo` | Módulo |
| `area` | Área funcional |
| `tipo` | Tipo da issue |
| `prioridade` | Prioridade |
| `equipe` | Equipe |
| `status` | Status workflow |
| `parceria` | Parceria |
| `sprint` | Sprint |
| `epico` | Épico |
| `repositorio` | Repositório GitLab |
| `situacao` | Situação de análise (coluna protegida no Excel) |
| `ano` | Ano de criação |
| `criadoDe` / `criadoAte` | Intervalo de criação |
| `fechadoDe` / `fechadoAte` | Intervalo de fechamento |

Opções de select carregadas de `v_filter_options_full` e pares módulo×área de `v_modulo_area_pairs`.

---

## Drill-down (KPI → Issues)

O componente `KpiGrid` (client) permite clicar em KPIs para ir a `/issues` **preservando os filtros globais** da URL e adicionando:

| KPI clicado | Parâmetro extra |
|-------------|-----------------|
| Total filtrado | — |
| Fechadas | `estado=closed` |
| Abertas / Bugs / Melhorias | `estado=open` |

O parâmetro `page` é removido ao navegar para evitar página inválida.

---

## Layout compartilhado

**Arquivo:** `app/(dashboard)/layout.tsx` (síncrono, sem `await` no topo)

**Wrappers async:** `components/layout/DashboardLayoutParts.tsx`

| Parte | Wrapper async | Dados buscados |
|-------|---------------|----------------|
| Header | `GovBrHeaderAsync` | `fetchLastSync`, `getSessionUser` |
| Sidebar | `SidebarAsync` | `isCurrentUserAdmin` |
| Mobile nav | `MobileNavAsync` | `isCurrentUserAdmin` |
| Filtros globais | `GlobalFiltersAsync` | `fetchFilterOptions` |

Cada parte está em `<Suspense>` com fallback próprio. O slot `{children}` (conteúdo da página) renderiza **em paralelo** com header, sidebar e filtros — não espera o `Promise.all` do layout.

- `GovBrHeader` — exibe última sync (`sync_runs.finished_at`).
- `Sidebar` / `MobileNav` — navegação.
- `GlobalFilters` — barra de filtros (client component).
- `GovBrFooter` — rodapé GovBR (estático).

### Estados de carregamento (`loading.tsx`)

Cada rota principal possui `loading.tsx` que renderiza `DashboardPageLoading` (skeleton). Durante navegação client-side entre páginas, o skeleton aparece imediatamente enquanto o Server Component da nova rota carrega.

Rotas com `loading.tsx`: `/`, `/alertas`, `/temporal`, `/detalhamento`, `/qualidade`, `/sprint`, `/equipes`, `/issues`, `/analistas`.

---

## Componentes de visualização

| Componente | Uso |
|------------|-----|
| `KpiCard` / `KpiGrid` | Cards numéricos com accent color |
| `BarChartCard` | Barras verticais ou horizontais (Recharts) |
| `DonutChartCard` | Distribuição circular |
| `FluxoMensalCard` | Série temporal criados/fechados/backlog |
| `TabelaCard` | Wrapper para tabelas |
| `AlertasResumo` | Cards de resumo de alertas |
| `SetupBanner` | Aviso de configuração Supabase ausente |

Formatação pt-BR centralizada em `lib/format.ts` (números, percentuais, datas).
