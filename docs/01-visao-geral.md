# Visão geral

## O que é

O **KPI Dashboard** é a interface web para acompanhar indicadores de issues, alertas de qualidade e métricas operacionais dos repositórios GitLab (principalmente **Contratos v2** e repositórios relacionados).

O sistema é **predominantemente somente leitura** em relação ao GitLab: o pipeline Python sincroniza issues; o dashboard consulta RPCs/views. Exceções controladas no próprio dashboard: **administração de usuários** e **importação Planning Poker** (campos de relatório em `issues`/`milestone_issues`).

## Problema que resolve

Antes do dashboard web, os KPIs viviam em planilhas Excel (`MGI_Dashboard.xlsx` / `Dashboard_Contratos_v2.xlsx`), geradas diariamente pelo pipeline GitLab → Excel descrito em `docs/README_PIPELINE.md` do workspace. Isso funcionava para análise local, mas limitava:

- compartilhamento e acesso remoto;
- filtros interativos entre múltiplas visões;
- drill-down de KPIs para a listagem de issues;
- deploy acessível via browser (sem depender do Excel instalado).

O dashboard web replica e expande as visualizações do **Dashboard Executivo** Excel, consumindo os mesmos dados agora centralizados no **Supabase (Postgres)**.

## Fluxo de dados (vigente)

```
GitLab API + repos Git (kpi-pipeline)
        │
        ▼
kpi-pipeline
  ├── atualizar_gitlab_issues.py  →  gitlab_issues_raw.json
  ├── coleta_git_contratos.py     →  gitlab_git_data.json
  └── pipeline_maestro.py
          └── sync_supabase.py    →  upsert Supabase
                    │
                    ▼
              Supabase (Postgres)
         issues | releases | sync_runs
                    │
                    ▼
           kpi-dashboard (Next.js)
              consulta RPCs + views
```

O Excel **não faz mais parte do fluxo principal** de sincronização (confirmado no README do `kpi-pipeline`). Planilhas Excel e scripts legados permanecem no workspace histórico, mas o dashboard web depende exclusivamente do Supabase.

> **Ambiente:** o **kpi-dashboard** roda em **Windows** (Node.js + PowerShell) em desenvolvimento e na **Vercel** em produção. WSL/Linux faz parte do setup do repositório [`kpi-pipeline`](https://github.com/MariaHilmar/kpi-pipeline), não deste projeto web.

## Paridade Excel ↔ Web

Conforme `docs/SETUP_DASHBOARD_WEB.md` e implementação atual:

| Visualização Excel | Equivalente Web |
|--------------------|-----------------|
| Parcerias | `/detalhamento` — gráfico Parcerias |
| Issues por Repositório | agregação `repositorio` (filtros globais) |
| Área Funcional (top 14) | `/detalhamento` — Área Funcional |
| Top Desenvolvedores (top 12) | `/equipes` — Top Desenvolvedores |
| Merge em master | `/equipes` — Merge em master |
| Qualidade dos Dados | `/qualidade` |
| Releases Git | tabela `releases` (fetchers) |
| Dashboard Executivo (KPIs) | `/` — Executivo |
| Filtros Parceria / Sprint / Ano | filtros globais na barra superior |

Filtros adicionais na web (não presentes no Excel original): módulo, área, tipo, prioridade, equipe, status, épico, repositório, situação de análise e intervalos de datas de criação/fechamento.

## Público-alvo

- **Gestão / executivo:** visão consolidada de KPIs e evolução mensal (`/`).
- **Coordenação de sprint:** foco por sprint (`/sprint`) e importação de story points (`/importar-dados`).
- **Qualidade de dados:** conformidade de preenchimento e backlog sem tipo (`/qualidade`).
- **Operação:** alertas de issues sem épico/parceria, faixa de idade, lead times (`/alertas`).
- **Fluxo Kanban:** CFD, throughput, lead time, WIP e gargalos (`/fluxo`).
- **Parcerias:** relatório mensal de demandas com label `Parceria::` (`/parcerias`).
- **Analistas:** detalhamento por dimensão, busca paginada de issues (`/detalhamento`, `/issues`).

## Próximas evoluções (roadmap)

Itens registrados na documentação do workspace e no código:

| Item | Status |
|------|--------|
| Supabase Auth (restringir leitura) | **implementado** — ver [08-autenticacao.md](./08-autenticacao.md) |
| Relatório de fluxo Kanban (`/fluxo`) | **implementado** — ver [11-relatorio-fluxo.md](./11-relatorio-fluxo.md) |
| Relatório de parcerias (`/parcerias`) | **implementado** |
| Importação Planning Poker (`/importar-dados`) | **implementado** — ver [12-importar-dados.md](./12-importar-dados.md) |
| Integrar sync ao agendador automático (Vercel Cron ou Task Scheduler) | parcial — pipeline já orquestra sync |
| Tabela de issues com paginação | **implementado** (`/issues`) |
| Export Excel (Issues, Parcerias, Analistas) | **implementado** |
| Power BI / dashboards ad-hoc | roadmap Fase 3 (`ROADMAP_EXPANSÃO_PIPELINE.md`) |

## Restrições e premissas

1. **Dados atualizados pelo pipeline:** o header exibe a data da última sync bem-sucedida (`sync_runs`).
2. **Chave anon no frontend:** apenas `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `service_role` fica no pipeline Python e no servidor Next.js (admin/importação), nunca no browser.
3. **Filtro sentinela `Todos`:** valor padrão que desativa o recorte na RPC `_issues_filtered`.
4. **Renderização dinâmica:** páginas usam `searchParams` e/ou auth com cookies — HTML gerado no servidor a cada request. Cache de **dados** (não de página) via `unstable_cache` (tag `kpis`, TTL 24 h), invalidado pelo pipeline após sync. Streaming com `Suspense` no layout e na página Executivo; skeletons via `loading.tsx` na navegação.
