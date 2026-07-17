# Prueba controlada del Lifecycle Host: compila launcher + opcional simular update roto.
# Uso:
#   powershell -File scripts\lifecycle\verificar-ciclo-vida.ps1
#   powershell -File scripts\lifecycle\verificar-ciclo-vida.ps1 -CompileOnly
#   powershell -File scripts\lifecycle\verificar-ciclo-vida.ps1 -SimulateBroken

param(
  [switch]$CompileOnly,
  [switch]$SimulateBroken
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Project = Join-Path $RepoRoot "tools\drewrest-launcher\DrewRest.Launcher.csproj"
$DrewRest = Join-Path $RepoRoot "DrewRest"

Write-Host "=== Lifecycle: contratos ===" -ForegroundColor Cyan
$contracts = Join-Path $RepoRoot "scripts\lifecycle\contracts"
foreach ($name in @(
  "drewrest.config.schema.json",
  "versions.schema.json",
  "lifecycle-state.schema.json"
)) {
  $p = Join-Path $contracts $name
  if (-not (Test-Path $p)) { throw "Falta contrato: $p" }
  Write-Host "  OK $name" -ForegroundColor DarkGray
}

$mig = Join-Path $RepoRoot "services\api\prisma\migrations\20250716220000_lifecycle_platform\migration.sql"
if (-not (Test-Path $mig)) { throw "Falta migracion lifecycle_platform" }
Write-Host "  OK prisma lifecycle_platform" -ForegroundColor DarkGray

$migrateJs = Join-Path $RepoRoot "scripts\lifecycle\migrate.js"
if (-not (Test-Path $migrateJs)) { throw "Falta scripts/lifecycle/migrate.js" }

Write-Host "=== Lifecycle: compilar launcher ===" -ForegroundColor Cyan
& dotnet build $Project -c Release
if ($LASTEXITCODE -ne 0) { throw "dotnet build fallo" }

if ($CompileOnly) {
  Write-Host "CompileOnly: OK" -ForegroundColor Green
  exit 0
}

& (Join-Path $RepoRoot "scripts\empaquetar-launcher-drewrest.ps1")
if ($LASTEXITCODE -ne 0) { throw "empaquetar-launcher fallo" }

# Prueba de rollback a nivel de archivos (sin UI)
Write-Host "=== Lifecycle: prueba rollback archivos ===" -ForegroundColor Cyan
$testRoot = Join-Path $env:TEMP ("drewrest-lifecycle-test-" + [guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Force -Path $testRoot | Out-Null
try {
  $api = Join-Path $testRoot "api"
  $web = Join-Path $testRoot "web"
  $backup = Join-Path $testRoot "data\backups\20260101-120000"
  $appPrevApi = Join-Path $backup "app-prev\api"
  $appPrevWeb = Join-Path $backup "app-prev\web"
  New-Item -ItemType Directory -Force -Path $api, $web, $appPrevApi, $appPrevWeb | Out-Null
  Set-Content -Path (Join-Path $api "marker.txt") -Value "broken" -Encoding utf8
  Set-Content -Path (Join-Path $web "index.html") -Value "broken" -Encoding utf8
  Set-Content -Path (Join-Path $appPrevApi "marker.txt") -Value "stable" -Encoding utf8
  Set-Content -Path (Join-Path $appPrevWeb "index.html") -Value "stable" -Encoding utf8
  Set-Content -Path (Join-Path $backup "drewrest.config.json") -Value '{"configVersion":1}' -Encoding utf8

  Copy-Item -Path (Join-Path $appPrevApi "*") -Destination $api -Force -Recurse
  Copy-Item -Path (Join-Path $appPrevWeb "*") -Destination $web -Force -Recurse
  Copy-Item -Path (Join-Path $backup "drewrest.config.json") -Destination (Join-Path $testRoot "data\drewrest.config.json") -Force

  $marker = Get-Content (Join-Path $api "marker.txt") -Raw
  if ($marker.Trim() -ne "stable") { throw "Rollback de archivos fallo: marker=$marker" }
  Write-Host "  OK restore app-prev -> api/web" -ForegroundColor Green
}
finally {
  Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
}

if (-not $SimulateBroken) {
  Write-Host "Launcher empaquetado y rollback de archivos OK." -ForegroundColor Green
  exit 0
}

$exe = Join-Path $DrewRest "DrewRest.exe"
if (-not (Test-Path $exe)) { throw "No existe $exe" }

Write-Host "=== Simulacion update roto (requiere PG embebido) ===" -ForegroundColor Cyan
& $exe "simular-update-roto"
Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor DarkGray

$lastBackup = Join-Path $DrewRest "data\state\last-backup.json"
if (Test-Path $lastBackup) {
  Write-Host "last-backup.json presente" -ForegroundColor Green
} else {
  Write-Host "AVISO: no hay last-backup.json (PG puede no haber arrancado)" -ForegroundColor Yellow
}

Write-Host "Verificacion lifecycle terminada." -ForegroundColor Green
