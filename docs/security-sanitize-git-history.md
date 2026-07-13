# Limpeza de dados sensíveis no histórico Git

O PR `fix/sanitize-sensitive-public-data` remove e-mails e referências reais do **código atual**. Os commits antigos no GitHub ainda podem conter esses dados até uma reescrita de histórico.

## O que foi removido do código

| Dado | Onde estava |
|------|-------------|
| `seu-email@org.gov.br`, `outro-email@org.gov.br` | migrations 008/014, `schema.sql` |
| `YOUR_PROJECT_REF` / URL Supabase real | `.env.local.example` |

## Passo 1 — Merge do PR de sanitização

Merge o PR para `main` antes de reescrever o histórico, para que o estado atual fique alinhado com as substituições.

## Passo 2 — Reescrever histórico (git-filter-repo)

```powershell
cd seu-workspace\mgi-kpi-dashboard

# Backup espelho (recomendado)
git clone --mirror https://github.com/MariaHilmar/mgi-kpi-dashboard.git ..\mgi-kpi-dashboard-backup.git

# Script interativo (gera arquivo de substituições e mostra os comandos)
.\scripts\sanitize-git-history.ps1
```

Ou manualmente:

```powershell
python -m pip install --user git-filter-repo

# Criar replacements.txt (UTF-8):
# literal:seu-email@org.gov.br==>seu-email@org.gov.br
# literal:outro-email@org.gov.br==>outro-email@org.gov.br
# literal:https://xxx.supabase.co==>https://xxx.supabase.co
# literal:YOUR_PROJECT_REF==>YOUR_PROJECT_REF

git checkout main
git pull origin main

git filter-repo --force --replace-text replacements.txt

git remote add origin https://github.com/MariaHilmar/mgi-kpi-dashboard.git
git push origin --force --all
git push origin --force --tags
```

## Passo 3 — Colaboradores

Após o force push, todos devem **re-clonar** ou:

```powershell
git fetch origin
git checkout main
git reset --hard origin/main
```

Branches locais antigas ficam inválidas — recriar a partir de `origin/main`.

## Passo 4 — Rotação de chaves (opcional, recomendado)

A URL do projeto Supabase já foi pública. Se quiser endurecer:

1. Supabase → **Settings → API** → regenerar **anon key** (e service_role se necessário).
2. Atualizar variáveis na Vercel e em `.env.local`.
3. Redeploy do dashboard.

## Repositório mgi-kpi-pipeline

Não continha tokens nem e-mails nas migrations. Nenhuma reescrita de histórico necessária para credenciais; caminhos WSL locais são metadados de dev de baixo risco.
