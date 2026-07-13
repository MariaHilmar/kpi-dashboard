# =============================================================================
# Limpeza de dados sensíveis no HISTÓRICO git — mgi-kpi-dashboard
# =============================================================================
#
# ATENÇÃO: reescreve TODO o histórico. Exige force push e re-clone por colaboradores.
# Execute SOMENTE após merge do PR de sanitização (fix/sanitize-sensitive-public-data).
#
# Pré-requisitos:
#   - Python 3 com pip
#   - Acesso de admin ao repositório GitHub
#   - Backup local: git clone --mirror <url> mgi-kpi-dashboard-backup.git
#
# O que este script substitui em TODOS os commits:
#   - E-mails reais de admin nas migrations
#   - Referência do projeto Supabase (YOUR_PROJECT_REF)
#
# Após o force push, considere rotacionar a anon key no painel Supabase
# (Settings → API → Regenerate anon key) e atualizar Vercel/.env local.
# =============================================================================

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}

Set-Location $RepoRoot
Write-Host "Repositório: $RepoRoot" -ForegroundColor Cyan

# 1) Instalar git-filter-repo (uma vez)
python -m pip install --user git-filter-repo
$filterRepo = python -c "import shutil; print(shutil.which('git-filter-repo') or '')"
if (-not $filterRepo) {
    $scriptsDir = python -c "import site, os; print(os.path.join(site.USER_BASE, 'Scripts'))"
    $env:PATH = "$scriptsDir;$env:PATH"
}

# 2) Arquivo de substituições (formato git-filter-repo)
$replacementsFile = Join-Path $env:TEMP "mgi-dashboard-sensitive-replacements.txt"
@(
    "literal:seu-email@org.gov.br==>seu-email@org.gov.br"
    "literal:outro-email@org.gov.br==>outro-email@org.gov.br"
    "literal:https://xxx.supabase.co==>https://xxx.supabase.co"
    "literal:YOUR_PROJECT_REF==>YOUR_PROJECT_REF"
    "literal:# Supabase — configure com a URL do seu projeto==># Supabase — configure com a URL do seu projeto"
) | Set-Content -Encoding utf8 $replacementsFile

Write-Host "`nSubstituições em: $replacementsFile" -ForegroundColor Yellow
Get-Content $replacementsFile

Write-Host @"

Próximos passos MANUAIS (revise antes de executar):

  cd `"$RepoRoot`"
  git checkout main
  git pull origin main

  git filter-repo --force `
    --replace-text `"$replacementsFile`"

  git remote add origin https://github.com/MariaHilmar/mgi-kpi-dashboard.git
  git push origin --force --all
  git push origin --force --tags

Colaboradores devem re-clonar ou resetar:

  git fetch origin
  git reset --hard origin/main

"@ -ForegroundColor Green
