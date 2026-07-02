# Gera supabase/schema.sql (dump remoto ou concatenacao das migrations).
# Executar apos criar/editar qualquer migration.
param(
    [switch]$FromMigrations
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$argsList = @("supabase/generate_schema.py")
if ($FromMigrations) { $argsList += "--from-migrations" }

python @argsList
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
