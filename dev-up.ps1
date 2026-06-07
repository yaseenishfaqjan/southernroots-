# dev-up.ps1 — one-command local stack for Southern Roots Turf (Windows).
# Brings up isolated Postgres (5433) + Redis (6380), pushes schema, seeds the
# owner, and starts the API server. Safe to re-run.
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\dev-up.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$pgUrl = "postgresql://postgres:postgres@localhost:5433/southern_roots"

function Ensure-Container($name, $runArgs) {
  $exists = docker ps -a --filter "name=^/$name$" --format "{{.Names}}"
  if ($exists -eq $name) {
    $running = docker ps --filter "name=^/$name$" --format "{{.Names}}"
    if ($running -ne $name) { Write-Host "Starting $name..."; docker start $name | Out-Null }
    else { Write-Host "$name already running." }
  } else {
    Write-Host "Creating $name..."
    & docker @runArgs | Out-Null
  }
}

# 1) Postgres (durable named volume + auto-restart)
Ensure-Container "srt_pg" @(
  "run","-d","--name","srt_pg","--restart","unless-stopped",
  "-e","POSTGRES_DB=southern_roots","-e","POSTGRES_USER=postgres","-e","POSTGRES_PASSWORD=postgres",
  "-p","5433:5432","-v","srt_pgdata:/var/lib/postgresql/data","pgvector/pgvector:pg16"
)

# 2) Redis (auto-restart)
Ensure-Container "srt_redis" @(
  "run","-d","--name","srt_redis","--restart","unless-stopped","-p","6380:6379","redis:7-alpine"
)

# 3) Wait for Postgres
Write-Host "Waiting for Postgres..."
do { Start-Sleep -Seconds 2; docker exec srt_pg pg_isready -U postgres 2>$null | Out-Null } until ($LASTEXITCODE -eq 0)
Write-Host "Postgres ready."

# 4) Push schema (forward-slash path avoids the drizzle-kit Windows glob bug)
Write-Host "Pushing schema..."
$schema = "$root/lib/db/src/schema/index.ts" -replace '\\','/'
$env:DATABASE_URL = $pgUrl
& "$root/lib/db/node_modules/.bin/drizzle-kit" push --force --dialect=postgresql --schema=$schema --url=$pgUrl

# 5) Seed owner (no-op if it already exists)
Write-Host "Seeding owner (owner@southernroots.com / Passw0rd!)..."
Push-Location "$root/artifacts/api-server"
node --env-file=../../.env --import tsx/esm ./src/scripts/create-owner.ts owner@southernroots.com 'Passw0rd!' "Test Owner"
Pop-Location

# 6) Start API server if nothing is on :3001
$busy = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  Write-Host "API server already running on :3001."
} else {
  Write-Host "Starting API server on :3001..."
  Start-Process node -ArgumentList "--env-file=../../.env","--import","tsx/esm","./src/index.ts" -WorkingDirectory "$root/artifacts/api-server"
}

Write-Host "`nReady. API: http://localhost:3001/api/healthz" -ForegroundColor Green
Write-Host "Dashboard: run  pnpm --filter @workspace/web-app run dev  -> http://localhost:5173" -ForegroundColor Green
