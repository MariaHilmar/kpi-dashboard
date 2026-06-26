# Visão geral

## O que é

O **MGI KPI Dashboard** é a interface web oficial para acompanhar indicadores de issues, alertas de qualidade e métricas operacionais dos repositórios GitLab do MGI (principalmente **Contratos v2** e repositórios relacionados).

O sistema é **somente leitura**: não altera issues no GitLab nem no Supabase. Toda escrita de dados é responsabilidade do pipeline Python [`mgi-kpi-pipeline`](https://github.com/MariaHilmar/mgi-kpi-pipeline).

## Problema que resolve

Antes do dashboard web, os KPIs viviam em planilhas Excel (`MGI_Dashboard.xlsx` / `Dashboard_Contratos_v2.xlsx`), geradas diariamente pelo pipeline GitLab → Excel descrito em `docs/README_PIPELINE.md` do workspace. Isso funcionava para análise local, mas limitava:

- compartilhamento e acesso remoto;
- filtros interativos entre múltiplas visões;
- drill-down de KPIs para a listagem de issues;
- deploy acessível via browser (sem depender do Excel instalado).

O dashboard web replica e expande as visualizações do **Dashboard Executivo** Excel, consumindo os mesmos dados agora centralizados no **Supabase (Postgres)**.

## Fluxo de dados (vigente)

```
GitLab API + repos Git (WSL)
        │
        ▼
mgi-kpi-pipeline
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
           mgi-kpi-dashboard (Next.js)
              consulta RPCs + views
```

O Excel **não faz mais parte do fluxo principal** de sincronização (confirmado no README do `mgi-kpi-pipeline`). Planilhas Excel e scripts legados permanecem no workspace histórico, mas o dashboard web depende exclusivamente do Supabase.

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
- **Coordenação de sprint:** foco por sprint (`/sprint`).
- **Qualidade de dados:** conformidade de preenchimento e backlog sem tipo (`/qualidade`).
- **Operação:** alertas de issues sem épico/parceria, faixa de idade, lead times (`/alertas`).
- **Analistas:** detalhamento por dimensão, busca paginada de issues (`/detalhamento`, `/issues`).

## Próximas evoluções (roadmap)

Itens registrados na documentação do workspace e no código:

| Item | Status |
|------|--------|
| Supabase Auth (restringir leitura) | planejado |
| Integrar sync ao agendador automático (Vercel Cron ou Task Scheduler) | parcial — pipeline já orquestra sync |
| Tabela de issues com paginação | **implementado** (`/issues`) |
| Power BI / dashboards ad-hoc | roadmap Fase 3 (`ROADMAP_EXPANSÃO_PIPELINE.md`) |

## Restrições e premissas

1. **Dados atualizados pelo pipeline:** o header exibe a data da última sync bem-sucedida (`sync_runs`).
2. **Chave anon no frontend:** apenas `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `service_role` fica no pipeline Python.
3. **Filtro sentinela `Todos`:** valor padrão que desativa o recorte na RPC `_issues_filtered`.
4. **Renderização dinâmica:** todas as páginas usam `export const dynamic = "force-dynamic"` — sem cache estático de dados.
