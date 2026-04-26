[CmdletBinding()]
param(
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceFile = Join-Path $repoRoot "study_group_supabase.html"
$publicDir = Join-Path $repoRoot "public"
$targetFile = Join-Path $publicDir "index.html"
$noJekyllFile = Join-Path $publicDir ".nojekyll"

if (-not (Test-Path -LiteralPath $sourceFile)) {
  throw "Source file missing: $sourceFile"
}

if (-not (Test-Path -LiteralPath $publicDir)) {
  New-Item -ItemType Directory -Path $publicDir | Out-Null
}

if ($CheckOnly) {
  if (-not (Test-Path -LiteralPath $targetFile)) {
    throw "Publish file missing: $targetFile"
  }

  $sourceHash = (Get-FileHash -LiteralPath $sourceFile -Algorithm SHA256).Hash
  $targetHash = (Get-FileHash -LiteralPath $targetFile -Algorithm SHA256).Hash

  if ($sourceHash -ne $targetHash) {
    throw "Publish file is out of sync. Run scripts/sync-pages.ps1 before push."
  }

  if (-not (Test-Path -LiteralPath $noJekyllFile)) {
    throw "Missing public/.nojekyll. Run scripts/sync-pages.ps1 before push."
  }

  Write-Host "Publish files are in sync."
  exit 0
}

Copy-Item -LiteralPath $sourceFile -Destination $targetFile -Force
Set-Content -LiteralPath $noJekyllFile -Value "" -NoNewline

$syncedHash = (Get-FileHash -LiteralPath $targetFile -Algorithm SHA256).Hash

Write-Host "Synced study_group_supabase.html -> public/index.html"
Write-Host "Ensured public/.nojekyll"
Write-Host "SHA256: $syncedHash"
