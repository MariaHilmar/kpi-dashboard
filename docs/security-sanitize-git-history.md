# Limpeza de histórico Git (portfólio público)

O **código atual** em `main` já foi sanitizado (PR #52). Porém commits antigos no GitHub ainda expõem conteúdo que não deveria estar num repositório público de portfólio.

## Auditoria do histórico (2026-07-13)

| Categoria | No histórico? | Risco | Ação |
|-----------|---------------|-------|------|
| `.env.local` / JWT / chaves reais | Não encontrado | — | Nenhuma |
| URL Supabase real | Não (só `xxx.supabase.co`) | — | Nenhuma |
| E-mails reais em migrations | Não (só placeholders) | — | Nenhuma |
| `docs/analise/` (5 arquivos) | **Sim** — desde `fee057b` | Médio | **Remover do histórico** |
| `tmp-*` (37 arquivos de debug) | **Sim** — desde `79f69c9` | Baixo | **Remover do histórico** |
| `seu-workspace` em docs | **Sim** — commits antigos | Baixo | Substituir por placeholder |
| Caminhos WSL (`\\wsl.localhost\...`) | **Sim** — em `docs/analise/` | Médio | Removidos com a pasta |
| `Co-authored-by: Cursor` em commits | **Sim** — alguns commits | Baixo | Remover dos metadados |

`contratos_v2` e `gitlab.com/comprasnet/...` permanecem no código por serem parte da lógica do app (não são vazamento acidental de credenciais).

## Pré-requisitos

1. **Merge/commit** das limpezas do HEAD em `main` (remoção de `docs/analise/`, `tmp-*`, `.gitignore`, etc.).
2. **Backup espelho** do repositório remoto:

```powershell
git clone --mirror https://github.com/MariaHilmar/mgi-kpi-dashboard.git seu-workspace\mgi-kpi-dashboard-backup.git
```

3. Python 3 com `git-filter-repo`:

```powershell
python -m pip install --user git-filter-repo
```

4. Avisar colaboradores (se houver): após force push, todos devem **re-clonar**.

## Passo a passo (recomendado)

### 1. Simular

```powershell
cd seu-workspace\mgi-kpi-dashboard
git checkout main
git pull origin main

pwsh scripts/sanitize-git-history.ps1
```

Mostra paths removidos, substituições e comandos sem alterar nada.

### 2. Executar reescrita local

```powershell
pwsh scripts/sanitize-git-history.ps1 -Execute -Force
```

O script:

- remove `docs/analise/` e `tmp-*` de **todos** os commits;
- substitui `seu-workspace` e caminhos WSL em arquivos restantes;
- remove `Co-authored-by: Cursor` dos metadados de commit;
- verifica se o histórico local ficou limpo.

### 3. Verificar manualmente

```powershell
git log --oneline -10
git log --all --oneline -- docs/analise/          # deve estar vazio
git log --all --oneline -- tmp-after-fix.png      # deve estar vazio
git log -p --all -S "wsl.localhost" -- docs/      # deve estar vazio
git log -p --all -S "seu-workspace"            # deve estar vazio
```

### 4. Force push

```powershell
pwsh scripts/sanitize-git-history.ps1 -Execute -Push -Force
```

Ou manualmente:

```powershell
git push origin --force --all
git push origin --force --tags
```

### 5. Pós-push

Em cada clone local:

```powershell
git fetch origin
git checkout main
git reset --hard origin/main
git remote prune origin
```

Branches locais antigas ficam inválidas — recriar a partir de `origin/main`.

### 6. Rotação de chaves (opcional)

Não foram encontradas chaves reais no histórico. Rotacionar a **anon key** no Supabase continua sendo boa prática ao tornar o repo público:

1. Supabase → **Settings → API** → regenerar anon key (e service_role se necessário).
2. Atualizar Vercel e `.env.local`.
3. Redeploy.

## Execução manual (alternativa)

```powershell
cd seu-workspace\mgi-kpi-dashboard
git checkout main
git pull origin main

# replacements.txt (UTF-8)
# literal:seu-workspace==>seu-workspace
# literal:seu-workspace==>seu-workspace
# literal:\\wsl.localhost\Ubuntu\root\MGI\==>seu-caminho-wsl-removido\

git filter-repo --force `
  --invert-paths `
  --path docs/analise/ `
  --path-glob "tmp-*" `
  --replace-text replacements.txt `
  --commit-callback "$(Get-Content scripts/git-filter-commit-callback.py -Raw)"

git remote add origin https://github.com/MariaHilmar/mgi-kpi-dashboard.git
git push origin --force --all
git push origin --force --tags
```

## O que o PR #52 já corrigiu (HEAD atual)

| Dado | Onde estava |
|------|-------------|
| Referência `seu-workspace\.env` | `.env.local.example` |
| `UPDATE` com e-mails em migrations | `008_profiles_admin.sql`, `014_seed_admin_users.sql` |
| Instruções de promoção manual de admin | `docs/08-autenticacao.md` |

Isso **não** apaga commits antigos — apenas o estado atual.

## Repositório mgi-kpi-pipeline

Auditoria separada: sem tokens nem e-mails reais nas migrations. Reescrita de histórico não necessária para credenciais.
