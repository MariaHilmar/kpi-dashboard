# Limpeza de dados sensíveis no repositório

## Estado atual (limpeza no HEAD — sem reescrita de histórico)

O merge em `main` remove do **último commit** (working tree público):

| Removido | Motivo |
|----------|--------|
| `docs/analise/` | Documentos internos de diagnóstico — não pertencem ao portfólio público |
| `tmp-*` (37 arquivos) | Artefatos locais de debug (imagens, scripts, `.docx`) |
| E-mails e URLs reais em migrations | Já tratados em PRs anteriores de sanitização |

O `.gitignore` passa a ignorar `tmp-*`, `coverage/` e `*.tsbuildinfo` para evitar commits acidentais.

**Importante:** commits antigos no GitHub ainda podem conter `docs/analise/` e `tmp-*` acessíveis via histórico (`git log`, browse de commit). O repositório fica **limpo para quem clona `main` hoje**, mas não apaga o passado.

## Próximo passo (planejado — após fechar o portfólio)

Reescrita de histórico com `git-filter-repo` + **force push** único, documentado em `scripts/sanitize-git-history.ps1`. Executar somente quando:

1. Todas as entregas de portfólio estiverem mergeadas em `main`;
2. Colaboradores forem avisados (re-clone obrigatório);
3. Backup espelho existir (`git clone --mirror`).

```powershell
cd D:\mgi-workspace\mgi-kpi-dashboard

# Backup espelho (recomendado)
git clone --mirror https://github.com/MariaHilmar/mgi-kpi-dashboard.git ..\mgi-kpi-dashboard-backup.git

# Modo interativo ou -Execute após revisar
.\scripts\sanitize-git-history.ps1
```

O script pode remover paths (`docs/analise/`, `tmp-*`) de **todos** os commits e substituir literais sensíveis via `replacements.txt`.

## Substituição de literais (e-mails, URLs)

| Dado | Onde estava |
|------|-------------|
| `seu-email@org.gov.br`, `outro-email@org.gov.br` | migrations 008/014, `schema.sql` |
| `YOUR_PROJECT_REF` / URL Supabase real | `.env.local.example` |

## Após force push (futuro)

```powershell
git fetch origin
git checkout main
git reset --hard origin/main
```

Branches locais antigas ficam inválidas — recriar a partir de `origin/main`.

## Rotação de chaves (opcional)

Se URLs ou chaves já foram públicas:

1. Supabase → **Settings → API** → regenerar **anon key** (e service_role se necessário).
2. Atualizar variáveis na Vercel e em `.env.local`.
3. Redeploy do dashboard.

## Repositório mgi-kpi-pipeline

Repositório separado (Python). O **mgi-kpi-dashboard** não depende de Linux/WSL no desenvolvimento local (Windows + PowerShell).
