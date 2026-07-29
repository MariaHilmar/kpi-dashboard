# Identidades GitLab e vínculo com usuários

Issues do GitLab e contas do dashboard são relacionadas pelo **ID global do usuário no GitLab** (`author.id`, `assignees[].id`), não por e-mail nem por nome de exibição.

Migration: **`012_gitlab_identities.sql`** (aplicar após 001–011).

## Modelo de dados

### `gitlab_users`

Cadastro de identidades GitLab (escrito pelo pipeline).

| Coluna | Descrição |
|--------|-----------|
| `id` | ID global GitLab (PK) |
| `username` | Handle (`@usuario`) |
| `name` | Nome no GitLab |
| `email` | E-mail quando conhecido (API ou commits) |

### `profiles` (dashboard)

| Coluna | Descrição |
|--------|-----------|
| `full_name` | Nome de exibição em telas e relatórios |
| `gitlab_user_id` | FK → `gitlab_users.id` — **vínculo preferencial** |
| `autor_issues` | Legado: valor exato de `issues.autor` se o nome GitLab divergir |

### `issues`

Colunas de texto (exibição): `autor`, `assignee`, `desenvolvedor`.

Colunas de relacionamento (escritas pelo sync):

| Coluna | Papel |
|--------|--------|
| `gitlab_author_id` | Criador da issue |
| `gitlab_assignee_ids` | Responsáveis GitLab (array) |
| `gitlab_developer_id` | Dev principal (Git e-mail → ID, ou fallback assignee) |

### `issue_participants`

Vínculo N:N com **papel**:

| `role` | Origem |
|--------|--------|
| `author` | API GitLab (`author.id`) |
| `assignee` | API GitLab (`assignees[].id`) |
| `developer` | Commits Git (`%ae`) ou fallback assignee |

Campo `source`: `gitlab_api` | `git_commits` | `assignee_fallback`.

### O que **não** usa ID GitLab

- **`solicitante`** — vem de label `Solicitante::…` (dimensão de negócio, não usuário).
- **Login** — continua por e-mail/senha (Supabase Auth).

## Fluxo operacional (pós-migration)

```powershell
cd seu-workspace\kpi-pipeline

# 1) Issues com author.id / assignees[].id no JSON
python atualizar_gitlab_issues.py --full

# 2) Upsert issues + gitlab_users + issue_participants
python sync_supabase.py

# 3) Vincular contas existentes do dashboard (por e-mail)
python backfill_profile_gitlab_ids.py --dry-run   # simular
python backfill_profile_gitlab_ids.py             # aplicar
```

Para **novos** usuários a partir do GitLab:

```powershell
python provision_gitlab_users.py
```

(já preenche `profiles.gitlab_user_id` ao criar a conta.)

## Dashboard

### Minha conta (`/conta`)

- **Nome de exibição** → `profiles.full_name` (`PATCH /api/account/profile`)
- **Senha** → Supabase Auth

### Admin → Usuários

- **Nome de exibição**, **ID GitLab**, **Autor das issues (legado)**, papel, status
- API: `GET/POST /api/admin/users`, `PATCH /api/admin/users/[id]`

### Analistas (`/analistas`)

Filtro de issues do analista:

1. Se `profiles.gitlab_user_id` preenchido → `issues.gitlab_author_id = gitlab_user_id` (RPC `p_gitlab_user_id`)
2. Senão → filtro legado por nome (`issues.autor` vs `full_name` / `autor_issues`)

## Validação SQL

```sql
-- Identidades e participantes
select count(*) from gitlab_users;
select role, count(*) from issue_participants group by role;

-- Issues com autor vinculado
select
  count(*) filter (where gitlab_author_id is not null) as com_id,
  count(*) as total
from issues
where coalesce(ano_criacao, 0) >= 2024;

-- Perfis do dashboard vinculados
select count(*) filter (where gitlab_user_id is not null) as vinculados,
       count(*) as total
from profiles;
```

## Arquivos relacionados

**Pipeline**

```
atualizar_gitlab_issues.py    # captura author.id, assignees[].id
processar_issues_memoria.py   # monta IDs e participantes
gitlab_identities.py          # sync gitlab_users + issue_participants
sync_supabase.py
provision_gitlab_users.py
backfill_profile_gitlab_ids.py
```

**Dashboard**

```
lib/auth/profile.ts           # resolveAnalistaIssueFilter()
lib/dashboard/analistas.ts    # RPC com p_gitlab_user_id
app/api/account/profile/route.ts
components/auth/DisplayNameForm.tsx
components/admin/UserForm.tsx
```

**Banco**

```
supabase/migrations/012_gitlab_identities.sql
```
