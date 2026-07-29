# =============================================================================
# Reescrita de histórico Git — kpi-dashboard (portfólio público)
# =============================================================================
#
# Remove do histórico INTEIRO:
#   - docs/analise/          (diagnósticos internos, caminhos WSL)
#   - tmp-*                  (artefatos de debug na raiz)
#   - referências seu-workspace em arquivos que permanecem
#   - trailers Co-authored-by: Cursor nos metadados de commit (opcional, padrão ligado)
#
# ATENÇÃO: reescreve TODO o histórico. Exige force push e re-clone.
#
# Uso:
#   pwsh scripts/sanitize-git-history.ps1              # simulação (padrão)
#   pwsh scripts/sanitize-git-history.ps1 -Execute     # executa filter-repo
#   pwsh scripts/sanitize-git-history.ps1 -Execute -Push -Force
#
# Pré-requisitos:
#   - Python 3 + pip (git-filter-repo)
#   - Branch main atualizada com limpezas do HEAD (sem docs/analise, sem tmp-*)
#   - Backup: git clone --mirror <url> ..\kpi-dashboard-backup.git
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Execute,
    [switch]$Push,
    [switch]$Force,
    [switch]$KeepCursorCoauthor
)

$ErrorActionPreference = "Stop"

$RemoteUrl = "https://github.com/MariaHilmar/kpi-dashboard.git"
$RepoRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
    throw "Execute na raiz do clone kpi-dashboard (pasta com .git)."
}

Set-Location $RepoRoot

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Ensure-GitFilterRepo {
    python -m pip install --user git-filter-repo | Out-Null
    $cmd = python -c "import shutil; print(shutil.which('git-filter-repo') or '')"
    if (-not $cmd) {
        $scriptsDir = python -c "import site, os; print(os.path.join(site.USER_BASE, 'Scripts'))"
        $env:PATH = "$scriptsDir;$env:PATH"
        $cmd = Get-Command git-filter-repo -ErrorAction SilentlyContinue
        if (-not $cmd) {
            throw "git-filter-repo não encontrado. Instale: python -m pip install --user git-filter-repo"
        }
    }
}

function New-ReplacementsFile {
    $file = Join-Path $env:TEMP "mgi-dashboard-history-replacements.txt"
    @(
        "literal:seu-workspace==>seu-workspace"
        "literal:seu-workspace==>seu-workspace"
        "literal:seu-caminho-wsl-removido\\==>seu-caminho-wsl-removido\\"
    ) | Set-Content -Encoding utf8 $file
    return $file
}

function Test-HistoryClean {
    param([string]$Description, [string]$Command)
    Write-Host "  - $Description" -ForegroundColor DarkGray
    Write-Host "    $Command" -ForegroundColor DarkGray
}

Write-Host @"

╔══════════════════════════════════════════════════════════════════╗
║  Sanitização de histórico — kpi-dashboard                    ║
║  Modo: $(if ($Execute) { if ($Push) { 'EXECUTAR + FORCE PUSH' } else { 'EXECUTAR filter-repo' } } else { 'SIMULAÇÃO (-Execute para rodar)' })                          ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Yellow

Write-Step "Repositório: $RepoRoot"

$status = git status --porcelain
if ($status -and $Execute -and -not $Force) {
    throw @"
Working tree com alterações não commitadas.
Commit ou stash antes de reescrever o histórico, ou use -Force para ignorar este aviso.

$(git status --short)
"@
}

if ($status -and -not $Execute) {
    Write-Warning "Working tree com alterações locais (simulação apenas — nada será alterado)."
}

$currentBranch = git branch --show-current
if ($currentBranch -ne "main" -and -not $Force) {
    Write-Warning "Branch atual: $currentBranch (recomendado: main). Use -Force para continuar."
}

Write-Step "O que será removido/substituído em TODOS os commits"
Write-Host @"
  Paths removidos:
    - docs/analise/     (diagnósticos internos MGI, caminhos WSL)
    - tmp-*             (37 artefatos de debug na raiz)

  Substituições em arquivos restantes:
    - seu-workspace  -> seu-workspace
    - caminhos WSL      -> placeholder genérico

  Metadados de commit:
    - Co-authored-by: Cursor $(if ($KeepCursorCoauthor) { '(mantido — flag -KeepCursorCoauthor)' } else { '(removido)' })
"@

$replacementsFile = New-ReplacementsFile
Write-Host "`nArquivo de substituições: $replacementsFile" -ForegroundColor DarkYellow
Get-Content $replacementsFile | ForEach-Object { Write-Host "  $_" }

$filterArgs = @(
    "--force"
    "--invert-paths"
    "--path", "docs/analise/"
    "--path-glob", "tmp-*"
    "--replace-text", $replacementsFile
)

if (-not $KeepCursorCoauthor) {
    $commitCallback = @'
if commit.message:
    commit.message = commit.message.replace(
        b"Co-authored-by: Cursor <cursoragent@cursor.com>\n",
        b"",
    )
'@
    $filterArgs += "--commit-callback", $commitCallback
}

$filterCmd = "git filter-repo $($filterArgs -join ' ')"

Write-Step "Comandos que serão executados"
Write-Host "  git checkout main"
Write-Host "  git pull origin main"
Write-Host "  $filterCmd"
Write-Host "  git remote add origin $RemoteUrl"
if ($Push) {
    Write-Host "  git push origin --force --all"
    Write-Host "  git push origin --force --tags"
} else {
    Write-Host "  # (sem -Push: force push manual depois da verificação)"
}

Write-Step "Verificação pós-rewrite (deve retornar vazio)"
Test-HistoryClean "docs/analise no histórico" "git log --all --oneline -- docs/analise/"
Test-HistoryClean "tmp-* no histórico" "git log --all --oneline -- tmp-after-fix.png"
Test-HistoryClean "caminho WSL" "git log -p --all -S wsl.localhost -- docs/"
Test-HistoryClean "caminho local Windows" "git log -p --all -S seu-workspace"

if (-not $Execute) {
    Write-Host @"

Próximo passo: revise o plano acima e execute com -Execute.

  pwsh scripts/sanitize-git-history.ps1 -Execute
  pwsh scripts/sanitize-git-history.ps1 -Execute -Push -Force

Documentação completa: docs/security-sanitize-git-history.md
"@ -ForegroundColor Green
    exit 0
}

if (-not $Force) {
    $confirm = Read-Host "`nReescrever TODO o histórico local? Digite SIM para continuar"
    if ($confirm -ne "SIM") {
        Write-Host "Cancelado." -ForegroundColor Yellow
        exit 1
    }
}

Ensure-GitFilterRepo

Write-Step "Atualizando main"
git checkout main
git pull origin main

Write-Step "Executando git filter-repo (pode levar alguns minutos)"
& git filter-repo @filterArgs

if (-not (git remote | Select-String -Pattern "^origin$")) {
    Write-Step "Reconfigurando remote origin"
    git remote add origin $RemoteUrl
}

Write-Step "Verificando histórico local"
$checks = @(
    @{ Name = "docs/analise"; Cmd = { git log --all --oneline -- docs/analise/ 2>$null } }
    @{ Name = "tmp-after-fix.png"; Cmd = { git log --all --oneline -- tmp-after-fix.png 2>$null } }
    @{ Name = "wsl.localhost em docs/"; Cmd = { git log -p --all -S "wsl.localhost" -- docs/ 2>$null } }
)

$failed = $false
foreach ($check in $checks) {
    $result = & $check.Cmd
    if ($result) {
        Write-Host "  FALHOU: ainda há rastros de $($check.Name)" -ForegroundColor Red
        $result | Select-Object -First 3 | ForEach-Object { Write-Host "    $_" }
        $failed = $true
    } else {
        Write-Host "  OK: $($check.Name)" -ForegroundColor Green
    }
}

if ($failed) {
    throw "Verificação pós-filter-repo falhou. NÃO faça force push até corrigir."
}

Write-Host "`nHistórico local sanitizado com sucesso." -ForegroundColor Green

if ($Push) {
    if (-not $Force) {
        $confirmPush = Read-Host "Force push para origin? Digite SIM"
        if ($confirmPush -ne "SIM") {
            Write-Host "Push cancelado. Quando estiver pronta: git push origin --force --all && git push origin --force --tags"
            exit 0
        }
    }
    Write-Step "Force push"
    git push origin --force --all
    git push origin --force --tags
    Write-Host "`nConcluído. Re-clone recomendado em outras máquinas." -ForegroundColor Green
} else {
    Write-Host @"

Filter-repo concluído. Revise com:

  git log --oneline -5
  git log --all --oneline -- docs/analise/
  git log --all --oneline -- tmp-after-fix.png

Depois:

  pwsh scripts/sanitize-git-history.ps1 -Execute -Push -Force

Ou manualmente:

  git push origin --force --all
  git push origin --force --tags
"@ -ForegroundColor Green
}
