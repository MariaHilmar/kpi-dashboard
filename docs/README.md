# Documentação — MGI KPI Dashboard

Documentação do sistema **mgi-kpi-dashboard**: dashboard web de KPIs, alertas e issues dos projetos MGI.

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [01-visao-geral.md](./01-visao-geral.md) | Propósito, ecossistema MGI, paridade com Excel legado |
| [02-arquitetura.md](./02-arquitetura.md) | Stack, fluxo de dados, renderização SSR, cache e streaming |
| [03-paginas-funcionalidades.md](./03-paginas-funcionalidades.md) | Rotas, gráficos, KPIs, drill-down e filtros |
| [04-dados-supabase.md](./04-dados-supabase.md) | Schema Postgres, RPCs, views e contrato de filtros |
| [05-setup-deploy.md](./05-setup-deploy.md) | Ambiente local, variáveis, Supabase, Vercel |
| [06-desenvolvimento.md](./06-desenvolvimento.md) | Estrutura de código, testes, CI e convenções |
| [07-backlog-kpis.md](./07-backlog-kpis.md) | Backlog priorizado de KPIs (ondas de implementação) |
| [08-autenticacao.md](./08-autenticacao.md) | Login, cadastro, Minha conta e sessão (Supabase Auth) |
| [09-admin-usuarios.md](./09-admin-usuarios.md) | CRUD de usuários (somente admin) |
| [10-identidades-gitlab.md](./10-identidades-gitlab.md) | Vínculo issue ↔ usuário por ID GitLab, sync e backfill |
| [11-relatorio-fluxo.md](./11-relatorio-fluxo.md) | Relatório Kanban: CFD, throughput, lead time, WIP, APIs `/api/reports/flow/*` |
| [12-importar-dados.md](./12-importar-dados.md) | Importação Planning Poker (Excel/CSV) — story points e campos de sprint |

## Documentação relacionada no workspace

Material de contexto em `seu-workspace\docs`:

| Arquivo | Relevância |
|---------|------------|
| [SETUP_DASHBOARD_WEB.md](../../docs/SETUP_DASHBOARD_WEB.md) | Setup inicial web (parcialmente desatualizado — ver nota abaixo) |
| [README_PIPELINE.md](../../docs/README_PIPELINE.md) | Pipeline Excel legado (GitLab → Excel) |
| [README_QUICK_START.md](../../docs/README_QUICK_START.md) | Execução manual/agendada do pipeline Excel |
| [SETUP_AMBIENTE.md](../../docs/SETUP_AMBIENTE.md) | Pré-requisitos WSL, Git, Python |
| [ROADMAP_EXPANSÃO_PIPELINE.md](../../docs/ROADMAP_EXPANSÃO_PIPELINE.md) | Roadmap de dashboards avançados (Fase 3) |
| [DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md](../../docs/DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md) | Estrutura do Excel e módulos MGI |

> **Nota sobre o fluxo de dados:** o pipeline atual (`mgi-kpi-pipeline`) sincroniza **diretamente com o Supabase**, sem passar pelo Excel. O documento `SETUP_DASHBOARD_WEB.md` ainda menciona leitura da aba **Dados** de `MGI_Dashboard.xlsx`; isso reflete a fase inicial do projeto. Consulte [01-visao-geral.md](./01-visao-geral.md) para o fluxo vigente.

## Repositórios do ecossistema

| Repositório | Papel |
|-------------|-------|
| **mgi-kpi-dashboard** (este) | Visualização web (somente leitura) |
| [mgi-kpi-pipeline](https://github.com/MariaHilmar/mgi-kpi-pipeline) | Coleta GitLab, processamento, sync Supabase |
| `supabase/migrations/` (workspace) | Schema Postgres versionado |

---

**Última atualização:** 2026-07-03
