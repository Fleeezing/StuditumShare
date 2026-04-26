[CmdletBinding()]
param(
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "supabase-migration-map.ps1")

$repoRoot = Split-Path -Parent $PSScriptRoot
$migrationsDir = Join-Path $repoRoot "supabase/migrations"

if (-not (Test-Path -LiteralPath $migrationsDir)) {
  New-Item -ItemType Directory -Path $migrationsDir -Force | Out-Null
}

$map = Get-SupabaseMigrationMap

foreach ($entry in $map) {
  $sourceFile = Join-Path $repoRoot $entry.Source
  $targetFile = Join-Path $repoRoot $entry.Target

  if (-not (Test-Path -LiteralPath $sourceFile)) {
    throw "Missing source migration: $sourceFile"
  }

  if ($CheckOnly) {
    if (-not (Test-Path -LiteralPath $targetFile)) {
      throw "Missing generated migration: $targetFile"
    }

    $sourceHash = (Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash
    $targetHash = (Get-FileHash -LiteralPath $targetFile -Algorithm SHA256).Hash

    if ($sourceHash -ne $targetHash) {
      throw "Generated migration out of sync: $($entry.Target)"
    }

    continue
  }

  Copy-Item -LiteralPath $sourceFile -Destination $targetFile -Force
  Write-Host "Synced $($entry.Source) -> $($entry.Target)"
}

if ($CheckOnly) {
  Write-Host "Supabase migrations are in sync."
}
