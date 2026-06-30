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
  001_initial_schema.sql … 007_anon_least_privilege.sql
  008_profiles_admin.sql … 012_gitlab_identities.sql
```

Ou aplique todas via `supabase db push` a partir de `seu-workspace\supabase`.

3. Em **Project Settings → API**, copie:
   - **Project URL**
   - **anon public key** (frontend)
   - **service_role key** (apenas pipeline Python — nunca no Next.js)

### Sincronizar dados

No pipeline Python (workspace `mgi-kpi-pipeline`):

```powershell
cd seu-workspace\mgi-kpi-pipeline

# Variáveis — ou use .env em mgi-workspace/.env
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GITLAB_TOKEN*

# 1) Issues com IDs GitLab no JSON (após migration 012)
python atualizar_gitlab_issues.py --full

# 2) Sync Supabase (issues + gitlab_users + issue_participants)
python sync_supabase.py

# 3) Vincular perfis existentes ao GitLab (por e-mail)
python backfill_profile_gitlab_ids.py

# Ou pipeline completo (Git + issues + sync)
python pipeline_maestro.py
```

Confirme em Supabase → Table Editor: `issues`, `gitlab_users`, `issue_participants`, `profiles.gitlab_user_id` e `sync_runs` com status `success`.

Ver [10-identidades-gitlab.md](./10-identidades-gitlab.md).

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
   - `REVALIDATE_SECRET` (mesmo valor usado no pipeline para invalidar cache)
5. Deploy.

O `vercel.json` fixa a região **`gru1`** (São Paulo), alinhada ao Supabase do projeto (`sa-east-1`), reduzindo latência das RPCs.

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

Configure no ambiente do pipeline (`.env` do workspace ou variáveis de sistema):

```env
DASHBOARD_URL=https://seu-dashboard.vercel.app
REVALIDATE_SECRET=<mesmo valor do dashboard>
```

Sem `DASHBOARD_URL` e `REVALIDATE_SECRET`, o sync conclui normalmente mas o cache do dashboard não é invalidado (dados podem ficar desatualizados até 24 h).

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
| `REVALIDATE_SECRET` | Recomendada | Segredo para `POST /api/revalidate` (invalidação de cache após sync) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin only | CRUD de usuários em `/admin/usuarios` — nunca expor no browser |

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

### Dados desatualizados após sync

1. Confirme `REVALIDATE_SECRET` idêntico no dashboard e no pipeline.
2. Confirme `DASHBOARD_URL` apontando para a URL de produção correta.
3. Verifique logs do pipeline: mensagem de cache invalidado ou aviso `DASHBOARD_URL ou REVALIDATE_SECRET nao configurados`.
4. Teste manualmente: `curl -X POST https://<url>/api/revalidate -H "Authorization: Bearer <secret>"`.

## Checklist de go-live

- [ ] Migrations 001–012 aplicadas no Supabase
- [ ] `atualizar_gitlab_issues.py` + `sync_supabase.py` executados
- [ ] `backfill_profile_gitlab_ids.py` executado (perfis com `gitlab_user_id`)
- [ ] Pipeline/sync com sucesso (`sync_runs.status = success`)
- [ ] `.env.local` / Vercel env vars configuradas (anon key + `REVALIDATE_SECRET`)
- [ ] `npm run build` passa localmente
- [ ] CI GitHub Actions verde (`tsc` + testes)
- [ ] Deploy Vercel acessível
- [ ] Filtros globais retornam dados
- [ ] `/issues` pagina corretamente
