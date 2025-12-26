# Start-local PowerShell script: loads .env.local into environment and runs npm run dev
$envFile = Join-Path $PSScriptRoot '..\.env.local'
if (Test-Path $envFile) {
  Write-Host "Loading environment from $envFile"
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^\s*#' -or $line -eq '') { return }
    $parts = $line -split '=', 2
    if ($parts.Length -lt 2) { return }
    $k = $parts[0].Trim()
    $v = $parts[1].Trim("'\" ")
    Write-Host "  $k"
    $env:$k = $v
  }
} else {
  Write-Host "No .env.local found. Using environment as-is. To provide env vars, copy .env.local.example to .env.local and edit."
}

Write-Host "Starting dev server..."
npm run dev
