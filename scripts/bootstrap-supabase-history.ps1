[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "supabase-migration-map.ps1")

foreach ($entry in (Get-SupabaseMigrationMap)) {
  Write-Host "Marking remote migration as applied: $($entry.Version) ($($entry.Name))"
  if ($env:SUPABASE_DB_PASSWORD) {
    supabase migration repair $entry.Version --status applied --linked --password $env:SUPABASE_DB_PASSWORD
  }
  else {
    supabase migration repair $entry.Version --status applied --linked
  }
}

Write-Host "Finished bootstrapping remote migration history."
