# Remove branches remotas já mergeadas em origin/main.
# Uso (na raiz do repo, com permissão de push):
#   pwsh scripts/prune-merged-remote-branches.ps1
#   pwsh scripts/prune-merged-remote-branches.ps1 -WhatIf

param(
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

git fetch origin --prune | Out-Null

$branches = git branch -r --merged origin/main |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -match '^origin/' -and $_ -notmatch 'origin/main$' -and $_ -notmatch 'HEAD' } |
    ForEach-Object { $_.Replace('origin/', '') }

if (-not $branches) {
    Write-Host "Nenhuma branch remota mergeada para remover."
    exit 0
}

Write-Host "Branches mergeadas em origin/main ($($branches.Count)):"
$branches | ForEach-Object { Write-Host "  - $_" }

if ($WhatIf) {
    Write-Host "`nModo -WhatIf: nenhuma branch foi removida."
    exit 0
}

git push origin --delete $branches
git fetch origin --prune | Out-Null
Write-Host "`nConcluído. Branches remotas obsoletas removidas."
