# Setup e deploy

## Pré-requisitos

| Item | Versão / detalhe |
|------|------------------|
| Node.js | 20+ |
| npm | incluído com Node |
| Projeto Supabase | schema aplicado (`supabase/migrations/`) |
| Dados sincronizados | pipeline Python executado ao menos uma vez |

## 1. Configurar Supabase

### Criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. No **SQL Editor**, execute as migrations em ordem:

```
seu-workspace\supabase\migrations\
  001_initial_schema.sql
  002_grants.sql
  003_kpis_completos.sql
  004_issues_search.sql
  005_modulo_area_pairs.sql
  006_schema_hardening.sql
  007_anon_least_privilege.sql
```

3. Em **Project Settings → API**, copie:
   - **Project URL**
   - **anon public key** (frontend)
   - **service_role key** (apenas pipeline Python — nunca no Next.js)

### Sincronizar dados

No pipeline Python (workspace `mgi-kpi-pipeline`):

```powershell
cd seu-workspace\mgi-kpi-pipeline

# Variáveis (PowerShell) — ou use .env em mgi-workspace/.env
$env:SUPABASE_URL = "https://xxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."

# Sync completo via orquestrador
python pipeline_maestro.py

# Ou apenas sync (sem coleta Git)
python sync_supabase.py
```

Confirme em Supabase → Table Editor que `issues` possui registros e `sync_runs` tem status `success`.

## 2. Configurar o dashboard localmente

```powershell
cd seu-workspace\mgi-kpi-dashboard
npm install
copy .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> Use **somente** a anon key no frontend. A service role bypassa RLS e não deve ser exposta.

### Executar

```powershell
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Se as variáveis estiverem ausentes, o dashboard exibe o **SetupBanner** com instruções — não quebra com erro 500.

### Build de produção local

```powershell
npm run build
npm run start
```

## 3. Deploy na Vercel

### Via painel Vercel

1. Importe o repositório `MariaHilmar/mgi-kpi-dashboard`.
2. **Root Directory:** raiz do repo (padrão).
3. Framework: **Next.js** (detectado automaticamente via `vercel.json`).
4. Configure variáveis de ambiente de **Production** e **Preview**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.

### Via CLI

```powershell
cd seu-workspace\mgi-kpi-dashboard
npx vercel deploy --prod
```

### Proteção de deployment

Se **Deployment Protection** estiver ativa na Vercel, use bypass secret para acessar previews automatizados (ver AGENTS.md do workspace).

## 4. Manter dados atualizados

### Opção A — Pipeline manual (recomendado hoje)

Execute periodicamente no ambiente com acesso GitLab/WSL:

```powershell
cd seu-workspace\mgi-kpi-pipeline
python pipeline_maestro.py
```

Tempo típico do pipeline completo: **2–3 minutos** (conforme docs do workspace).

### Opção B — Agendamento Windows

O workspace documenta Task Scheduler para o pipeline Excel legado (`docs/AGENDAMENTO_TASK_SCHEDULER.md`). Para o fluxo Supabase, agende `pipeline_maestro.py` no mesmo horário (ex.: 08:10 diário).

### Opção C — Vercel Cron (planejado)

Sync automático via HTTP trigger + endpoint protegido — item de roadmap em `SETUP_DASHBOARD_WEB.md`.

## Variáveis de ambiente

### Dashboard (Next.js)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave pública anon |

### Pipeline Python (sync)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `SUPABASE_URL` | Sim (sync) | Mesma URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (sync) | Chave service role |
| `GITLAB_TOKEN` | Recomendada | Token para API GitLab |
| `MGI_BASE_DIR` | Não | Base para JSON/logs |

Ver tabela completa em `mgi-kpi-pipeline/README.md`.

## Troubleshooting

### SetupBanner aparece mesmo com .env.local

- Confirme que o arquivo está na **raiz** de `mgi-kpi-dashboard/`.
- Reinicie `npm run dev` após alterar env vars.
- Variáveis `NEXT_PUBLIC_*` são embutidas no build — redeploy na Vercel após mudanças.

### KPIs indisponíveis / gráficos vazios

1. Verifique se migrations foram aplicadas.
2. Confirme dados em `issues` (Supabase Table Editor).
3. Verifique logs do servidor Next (`console.error` nos fetchers).
4. Rode sync novamente: `python sync_supabase.py`.

### Filtros sem opções

View `v_filter_options_full` depende de dados em `issues`. Sync vazio → selects só com "Todos".

### Erro de permissão Supabase

Reaplique migrations `002`, `006`, `007` (grants para role `anon`).

### Header sem data de sync

Tabela `sync_runs` vazia ou sem registro `status = 'success'`. Execute o pipeline.

## Checklist de go-live

- [ ] Migrations 001–007 aplicadas no Supabase
- [ ] Pipeline executado com sucesso (`sync_runs.status = success`)
- [ ] `.env.local` / Vercel env vars configuradas (anon key apenas)
- [ ] `npm run build` passa localmente
- [ ] CI GitHub Actions verde (`tsc` + testes)
- [ ] Deploy Vercel acessível
- [ ] Filtros globais retornam dados
- [ ] `/issues` pagina corretamente
