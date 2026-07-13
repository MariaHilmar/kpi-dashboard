# MGI KPI Dashboard

Dashboard web para acompanhamento de KPIs, alertas e issues — modelo inspirado no ecossistema de entregas do **MGI** (GitLab, sprints, módulos, Planning Poker). Consome dados sincronizados via [Supabase](https://supabase.com) (Postgres + RPCs), em conjunto com o pipeline Python [`mgi-kpi-pipeline`](https://github.com/MariaHilmar/mgi-kpi-pipeline).

[![CI](https://github.com/MariaHilmar/mgi-kpi-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/MariaHilmar/mgi-kpi-dashboard/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=MariaHilmar_mgi-kpi-dashboard&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=MariaHilmar_mgi-kpi-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)

**Demo:** [web-mgi-delog.vercel.app](https://web-mgi-delog.vercel.app) (acesso autenticado)

![Tela de login — GovBR Design System](docs/screenshots/login.png)

## Sobre este repositório (portfólio)

Este é um **projeto de portfólio pessoal** de [Maria Hilmar](https://github.com/MariaHilmar). Foi construído com base em **dados, fluxos e necessidades reais** do contexto de KPIs e entregas em que atuei no MGI.

| | |
|---|---|
| **O que é** | Demonstração pública de arquitetura full-stack (Next.js, Supabase, GitLab, GovBR DS), testes e boas práticas de engenharia. |
| **O que não é** | Repositório oficial do MGI, produto institucional ou canal de suporte governamental. |
| **Dados** | Métricas e issues vêm de um Supabase alimentado pelo pipeline; não há dados sensíveis commitados no estado atual do repositório. |
| **Licença** | [MIT](LICENSE) — código aberto para estudo e referência técnica. |

Se você chegou aqui pelo contexto MGI: o dashboard reflete um sistema que desenvolvi e evoluí nesse ambiente; esta versão está no GitHub para **portfólio e entrevistas técnicas**, com documentação e testes.

## Visão geral

```
GitLab (issues/commits)
        │
        ▼
mgi-kpi-pipeline  ──►  processamento em memória  ──►  sync_supabase.py
                                                              │
                                                              ▼
                                                         Supabase (Postgres)
                                                              │
                                                              ▼
                                                    mgi-kpi-dashboard (este repo)
```

O dashboard é **somente leitura** em relação ao GitLab: não altera issues na origem. Ele consulta views e funções RPC no Supabase para montar gráficos, tabelas e KPIs com filtros globais compartilhados entre todas as páginas.

**Renderização:** Server Components no Next.js 16 — HTML gerado no servidor com streaming (`Suspense`) e cache de dados (`unstable_cache`, TTL 24 h). Skeletons durante navegação entre páginas.

## Funcionalidades

| Área | Rota | Descrição |
|------|------|-----------|
| Executivo | `/` | KPIs consolidados, evolução mensal, distribuição por status/tipo/módulo |
| Análise temporal | `/temporal` | Criados × fechados × backlog líquido por mês |
| Fluxo Kanban | `/fluxo` | CFD, throughput, lead time, WIP, gargalos e qualidade do histórico |
| Detalhamento | `/detalhamento` | Parceria, área funcional, lead time por módulo, KPI por tipo |
| Qualidade | `/qualidade` | Conformidade de preenchimento e backlog aberto |
| Alertas | `/alertas` | Sem épico/parceria, faixa de idade, maiores lead times |
| Sprint | `/sprint` | Visão focada no sprint selecionado nos filtros globais |
| Parcerias | `/parcerias` | Relatório mensal de demandas com label `Parceria::` |
| Equipes & Devs | `/equipes` | Volume por equipe, top desenvolvedores, merge em master |
| Analistas | `/analistas` | Relatório de atividades por analista (filtro por ID GitLab) |
| Issues | `/issues` | Busca livre, paginação, filtros (estado, SLA) e export Excel |
| Importar Dados | `/importar-dados` | Planning Poker — story points e campos de sprint (Excel/CSV) |
| Minha conta | `/conta` | Nome de exibição e alteração de senha |
| Admin usuários | `/admin/usuarios` | CRUD de contas (somente admin) |
| Login | `/login` | Entrada com e-mail e senha (Supabase Auth) |
| Cadastro | `/cadastro` | Criação de conta (opcional; desativável por env) |
| Recuperar senha | `/recuperar-senha` | Link por e-mail para redefinir senha |

**Autenticação:** rotas do dashboard exigem login. Papéis `admin` e `user`; área admin restrita. Issues são filtradas por analista via **`gitlab_user_id`** quando vinculado. Ver [docs/08-autenticacao.md](docs/08-autenticacao.md) e [docs/10-identidades-gitlab.md](docs/10-identidades-gitlab.md).

**Drill-down:** KPIs clicáveis (Total, Abertas, Fechadas, etc.) e contagens em gráficos/tabelas (`IssueCountLink`) levam para `/issues` em nova aba, preservando os filtros globais da URL.

**Tooltips contextuais:** ícones ℹ️ em títulos de seções explicam métricas e regras de cálculo (`InfoTooltip`, `CardSectionHeader`).

**Filtros globais:** módulo, área, tipo, prioridade, equipe, status, parceria, sprint, épico, repositório, ano e intervalos de datas — refletidos na query string e mantidos ao navegar entre páginas.

## Stack

- **Next.js 16** (App Router, Server Components, streaming com Suspense)
- **React 19** + **TypeScript**
- **Tailwind CSS 4** + [GovBR Design System](https://www.gov.br/ds/)
- **Recharts** — gráficos
- **Supabase** — backend de dados
- **Vitest** + Testing Library — 350+ testes unitários e de componente

## Pré-requisitos

- **Windows 10/11** + PowerShell (ambiente de desenvolvimento)
- Node.js 20+
- Projeto Supabase configurado (schema + RPCs — ver `supabase/migrations/` neste repositório)
- Dados sincronizados pelo [`mgi-kpi-pipeline`](https://github.com/MariaHilmar/mgi-kpi-pipeline) (`sync_supabase.py`)

> O CI usa `ubuntu-latest` (padrão GitHub Actions para Node.js). A produção roda na Vercel (Linux serverless). Nenhum WSL/Linux é necessário para desenvolver este dashboard no Windows.

## Configuração local

```powershell
git clone https://github.com/MariaHilmar/mgi-kpi-dashboard.git
cd mgi-kpi-dashboard
npm install
```

Crie `.env.local` a partir do exemplo:

```powershell
copy .env.local.example .env.local
```

Preencha as variáveis:

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) — usada no browser |
| `NEXT_PUBLIC_AUTH_REQUIRED` | (opcional) `false` desliga login em dev local |
| `NEXT_PUBLIC_ALLOW_SIGNUP` | (opcional) `false` desabilita `/cadastro` |

> Use apenas a **anon key** no frontend. A `service_role` fica exclusivamente no pipeline Python.

Inicie o servidor de desenvolvimento:

```powershell
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Se as variáveis não estiverem configuradas, o dashboard exibe um banner de setup em vez de quebrar.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (hot reload) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção (após `build`) |
| `npm run lint` | ESLint |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Testes com relatório de cobertura |
| `npx tsc --noEmit` | Checagem de tipos TypeScript |

## Estrutura do projeto

```
mgi-kpi-dashboard/
├── app/
│   ├── layout.tsx              # Layout raiz (metadados, fontes)
│   ├── api/
│   │   ├── revalidate/         # Invalidação de cache (POST, Bearer token)
│   │   ├── reports/flow/       # APIs REST do relatório Kanban
│   │   ├── import/planning-poker/  # Importação Excel/CSV
│   │   ├── issues/export/      # Export Excel da listagem
│   │   └── parcerias/export/   # Export Excel de parcerias
│   └── (dashboard)/            # Páginas do dashboard (route group)
├── components/
│   ├── dashboard/              # KPIs, gráficos, tabelas, milestone/
│   ├── dados/                  # Painel de importação Planning Poker
│   ├── issues/                 # Listagem e busca de issues
│   └── layout/                 # Header GovBR, sidebar, filtros
├── lib/dashboard/              # fetchers, cache, filters, import
├── tests/                      # Vitest + Testing Library
├── supabase/migrations/        # Schema Postgres e RPCs
└── .github/workflows/ci.yml    # CI: lint, tsc, testes, cobertura
```

Documentação detalhada: [docs/README.md](docs/README.md).

## CI/CD

A cada push ou pull request na branch `main`, o GitHub Actions executa lint, checagem de tipos e testes (com artefato de cobertura). Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Deploy (Vercel)

1. Conecte o repositório GitHub `MariaHilmar/mgi-kpi-dashboard`
2. Configure as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_*`, `REVALIDATE_SECRET`) no painel Vercel
3. Framework: **Next.js** (região `gru1` via `vercel.json`)
4. Deploy de **produção** apenas na branch `main`

Deploy manual (CLI):

```powershell
npx vercel deploy --prod
```

## Repositórios relacionados

| Repositório | Papel |
|-------------|-------|
| [mgi-kpi-pipeline](https://github.com/MariaHilmar/mgi-kpi-pipeline) | Coleta GitLab, processamento em memória, sync Supabase |
| **mgi-kpi-dashboard** (este) | Visualização web dos KPIs — **portfólio** |

## Segurança e histórico Git

O estado atual (`main`) não inclui arquivos temporários de desenvolvimento (`tmp-*`) nem documentos internos de análise. Commits antigos ainda podem expor esses paths até uma reescrita de histórico planejada — ver [docs/security-sanitize-git-history.md](docs/security-sanitize-git-history.md) e [SECURITY.md](SECURITY.md).
