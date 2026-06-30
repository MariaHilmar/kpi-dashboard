# Administração de usuários

CRUD de usuários restrito a **administradores**. Usuários comuns acessam o dashboard normalmente; admins gerenciam contas em **`/admin/usuarios`**.

## Papéis

| Papel | Permissões |
|-------|------------|
| **admin** | Dashboard completo + CRUD de usuários |
| **user** | Dashboard completo (sem administração) |

Inicialmente não há restrição por página dentro do dashboard — apenas a área admin é protegida.

## Funcionalidades (admin)

- **Listar** usuários (e-mail, nome, papel, status)
- **Incluir** usuário (e-mail, senha inicial, nome de exibição, ID GitLab opcional, papel, ativo)
- **Editar** nome de exibição, ID GitLab, autor legado (GitLab), papel, status e senha (opcional)
- **Ativar / inativar** — inativos são bloqueados no login (`ban` no Supabase Auth)

### Campos do formulário

| Campo UI | Coluna | Uso |
|----------|--------|-----|
| Nome de exibição | `full_name` | Telas e relatórios |
| ID GitLab | `gitlab_user_id` | Vínculo preferencial com issues (ver [10-identidades-gitlab.md](./10-identidades-gitlab.md)) |
| Autor das issues (GitLab) | `autor_issues` | Legado: match por nome em `issues.autor` se ID GitLab ausente |

## Regras de segurança

- Admin **não pode** inativar a própria conta
- Admin **não pode** remover o próprio papel admin
- Deve existir **pelo menos um admin ativo** no sistema
- Cadastro público (`/cadastro`) **desligado por padrão** — use `NEXT_PUBLIC_ALLOW_SIGNUP=true` se quiser reativar
- `gitlab_user_id` deve existir em `gitlab_users` (criado pelo sync ou upsert automático ao salvar)

## Banco de dados

| Migration | Conteúdo |
|-----------|----------|
| **`008_profiles_admin.sql`** | Tabela `profiles`, RLS, `is_admin()`, backfill Auth |
| **`011_analista_relatorio_por_autor.sql`** | Coluna `autor_issues`, filtro Analistas por nome |
| **`012_gitlab_identities.sql`** | `gitlab_users`, `issue_participants`, `profiles.gitlab_user_id`, IDs em `issues` |

Colunas principais de `public.profiles`:

- `id`, `email`, `full_name`, `gitlab_user_id`, `autor_issues`, `role`, `active`

Aplique migrations em ordem no Supabase **antes** de usar o CRUD.

### Vincular usuários já existentes

Após migration 012 e sync de issues:

```powershell
cd D:\mgi-workspace\mgi-kpi-pipeline
python backfill_profile_gitlab_ids.py --dry-run
python backfill_profile_gitlab_ids.py
```

Detalhes: [10-identidades-gitlab.md](./10-identidades-gitlab.md).

## Variáveis de ambiente (servidor)

| Variável | Obrigatória para CRUD |
|----------|------------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (apenas server-side, **não** `NEXT_PUBLIC_`) |

Configure em `.env.local` do dashboard e na Vercel (Environment Variables, sem prefixo público).

## API (admin)

| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/admin/users` | Listar |
| POST | `/api/admin/users` | Criar |
| PATCH | `/api/admin/users/[id]` | Editar / ativar / inativar |

Todas exigem sessão de admin.

## API (conta do próprio usuário)

| Método | Rota | Ação |
|--------|------|------|
| PATCH | `/api/account/profile` | Atualizar `full_name` (nome de exibição) |

Ver [08-autenticacao.md](./08-autenticacao.md).

## Arquivos

```
app/(dashboard)/admin/usuarios/page.tsx
app/(dashboard)/conta/page.tsx
app/api/admin/users/route.ts
app/api/admin/users/[id]/route.ts
app/api/account/profile/route.ts
components/admin/UsersManager.tsx
components/admin/UserForm.tsx
components/auth/DisplayNameForm.tsx
lib/auth/profile.ts
lib/auth/users-service.ts
lib/auth/account-service.ts
lib/supabase/admin.ts
supabase/migrations/008_profiles_admin.sql
supabase/migrations/011_analista_relatorio_por_autor.sql
supabase/migrations/012_gitlab_identities.sql
mgi-kpi-pipeline/backfill_profile_gitlab_ids.py
mgi-kpi-pipeline/provision_gitlab_users.py
```
