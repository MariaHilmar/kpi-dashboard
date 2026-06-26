# Documentação — MGI KPI Dashboard

Documentação do sistema **mgi-kpi-dashboard**: dashboard web de KPIs, alertas e issues dos projetos MGI.

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [01-visao-geral.md](./01-visao-geral.md) | Propósito, ecossistema MGI, paridade com Excel legado |
| [02-arquitetura.md](./02-arquitetura.md) | Stack, fluxo de dados, camadas da aplicação |
| [03-paginas-funcionalidades.md](./03-paginas-funcionalidades.md) | Rotas, gráficos, KPIs, drill-down e filtros |
| [04-dados-supabase.md](./04-dados-supabase.md) | Schema Postgres, RPCs, views e contrato de filtros |
| [05-setup-deploy.md](./05-setup-deploy.md) | Ambiente local, variáveis, Supabase, Vercel |
| [06-desenvolvimento.md](./06-desenvolvimento.md) | Estrutura de código, testes, CI e convenções |

## Documentação relacionada no workspace

Material de contexto em `D:\mgi-workspace\docs`:

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

**Última atualização:** 2026-06-26
