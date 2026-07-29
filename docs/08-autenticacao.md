# Autenticação de usuários

O dashboard usa **Supabase Auth** (e-mail + senha). Usuários autenticados acessam todo o dashboard; apenas **administradores** gerenciam contas em `/admin/usuarios`.

## Rotas

| Rota | Descrição |
|------|-----------|
| `/login` | Entrada com e-mail e senha |
| `/cadastro` | Criação de conta (pode ser desabilitada) |
| `/recuperar-senha` | Solicita link de redefinição por e-mail |
| `/redefinir-senha` | Define nova senha após clicar no link do e-mail |
| `/conta` | Nome de exibição e alteração de senha (logado) |
| `/admin/usuarios` | CRUD de usuários (somente admin) |
| `/auth/callback` | Callback OAuth/PKCE do Supabase |
| `/auth/logout` | Encerra sessão (POST) |

Todas as demais rotas exigem sessão válida (middleware).

## Configuração no Supabase

1. Abra o projeto em [supabase.com](https://supabase.com) → **Authentication** → **Providers**.
2. Ative **Email** (Sign in with email).
3. Em **URL Configuration**, adicione:
   - **Site URL:** `http://localhost:3000` (dev) e a URL de produção na Vercel.
   - **Redirect URLs:**
     - `http://localhost:3000/auth/callback`
     - `https://seu-dominio.vercel.app/auth/callback`
4. Em **Authentication → Email Templates → Reset password**, o link usa o redirect configurado acima.
5. **Usuários iniciais:** criados pelo admin em **`/admin/usuarios`** (recomendado) ou em Authentication → Users.

### Confirmação de e-mail

Se **Confirm email** estiver ativo, o usuário precisa clicar no link recebido antes do primeiro login. Para ambiente interno, pode desativar em **Authentication → Providers → Email**.

## Recuperar senha (esqueci)

1. Usuário acessa **`/recuperar-senha`** (ou link no login).
2. Informa o e-mail → Supabase envia link de recuperação.
3. Link redireciona para `/auth/callback?next=/redefinir-senha` → sessão temporária.
4. Em **`/redefinir-senha`**, define nova senha → redireciona ao dashboard.

## Minha conta (`/conta`)

1. Usuário acessa **`/conta`** (menu **Conta** no header ou sidebar).
2. **Nome de exibição** — gravado em `profiles.full_name` via `PATCH /api/account/profile` (exibido em telas e relatórios).
3. **Senha** — nova senha + confirmação → `updateUser({ password })`.

Não é necessário informar a senha atual (comportamento padrão Supabase Auth). Se precisar exigir reautenticação no futuro, use `supabase.auth.reauthenticate()`.

## Alterar senha (logado)

Mesmo fluxo acima, seção senha em **`/conta`**.

## Vínculo com issues GitLab

Contas do dashboard ligam-se às issues pelo **`profiles.gitlab_user_id`** (ID global GitLab), não pelo e-mail. Ver [10-identidades-gitlab.md](./10-identidades-gitlab.md) para sync, backfill e página Analistas.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | — | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Chave anon (browser + server) |
| `NEXT_PUBLIC_AUTH_REQUIRED` | `true` | `false` desliga proteção (só dev local) |
| `NEXT_PUBLIC_ALLOW_SIGNUP` | `false` | `true` habilita cadastro público em `/cadastro` |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Server-only; obrigatória para CRUD admin |

## Primeiro administrador

Após aplicar as migrations e criar o primeiro usuário em **Authentication → Users** (ou `/cadastro` em dev), promova-o a admin no **SQL Editor** do Supabase:

```sql
update public.profiles
set role = 'admin', active = true, updated_at = now()
where lower(email) = lower('seu-email@org.gov.br');
```

Não commite e-mails reais nas migrations — configure apenas no ambiente.

## RBAC (admin)

Gerenciamento de usuários em **`/admin/usuarios`** — ver [09-admin-usuarios.md](./09-admin-usuarios.md).

- Papéis: `admin` | `user`
- Inativos não entram no sistema
- CRUD usa `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor

## RBAC futuro

Restrição por página ou por módulo do dashboard (além de admin/user) pode usar custom claims ou colunas extras em `profiles`.

## Desenvolvimento local

```powershell
cd seu-workspace\kpi-dashboard
copy .env.local.example .env.local
# Preencher NEXT_PUBLIC_SUPABASE_* 
npm run dev
```

Para testar sem login (não recomendado em produção):

```env
NEXT_PUBLIC_AUTH_REQUIRED=false
```

## Produção (Vercel)

1. Configure as mesmas env vars no painel Vercel.
2. Configure env vars no painel Vercel (inclua `SUPABASE_SERVICE_ROLE_KEY` como secret server-side).
3. Mantenha cadastro público desligado (`NEXT_PUBLIC_ALLOW_SIGNUP` omitido ou `false`).

## Arquivos principais

```
lib/supabase/
  env.ts          # flags AUTH_REQUIRED, ALLOW_SIGNUP
  server.ts       # cliente server (cookies)
  client.ts       # cliente browser
  middleware.ts   # refresh + redirect
  session.ts      # getSessionUser()
middleware.ts     # protege rotas
components/auth/  # AuthForm, AuthMenu, DisplayNameForm, ChangePasswordForm
app/conta/        # Minha conta
app/login/        # página de login
app/cadastro/     # página de cadastro
app/auth/         # callback e logout
app/api/account/profile/  # PATCH nome de exibição
```
