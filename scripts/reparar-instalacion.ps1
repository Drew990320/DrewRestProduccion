# Reparacion automatica de la instalacion on-prem (npm, prisma generate, vendor).
param([string]$InstallRoot = "")

$ErrorActionPreference = "Stop"

if ($InstallRoot) {
  $root = (Resolve-Path $InstallRoot).Path
} else {
  $root = Split-Path -Parent $PSScriptRoot
}

$api = Join-Path $root "api"
$vendorNode = Join-Path $root "vendor\node"
$nodeExe = Join-Path $vendorNode "node.exe"
$npmCmd = Join-Path $vendorNode "npm.cmd"
$npxCmd = Join-Path $vendorNode "npx.cmd"

if (-not (Test-Path (Join-Path $api "package.json"))) {
  Write-Host "[ERROR] Falta api\package.json" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path (Join-Path $api "vendor\shared-domain\dist\index.js"))) {
  Write-Host "[ERROR] Falta api\vendor\shared-domain. Usa el paquete DrewRest completo." -ForegroundColor Red
  exit 1
}

if (Test-Path $nodeExe) {
  $env:PATH = "$vendorNode;$env:PATH"
  Write-Host "Usando Node embebido: $nodeExe" -ForegroundColor DarkGray
} elseif (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "[ERROR] Falta vendor\node\node.exe e tampoco hay Node.js en PATH." -ForegroundColor Red
  Write-Host "Vuelve a empaquetar o instala Node.js LTS." -ForegroundColor Yellow
  exit 1
}

$needsInstall = -not (Test-Path (Join-Path $api "node_modules"))
$sharedOk = Test-Path (Join-Path $api "node_modules\@drewrest\shared-domain\package.json")

if ($needsInstall -or -not $sharedOk) {
  Write-Host "Reparando dependencias del API (npm install)..." -ForegroundColor Cyan
  Push-Location $api
  try {
    if (Test-Path $npmCmd) {
      & $npmCmd install --omit=dev
    } else {
      npm install --omit=dev
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } finally {
    Pop-Location
  }
}

Write-Host "Generando cliente Prisma..." -ForegroundColor DarkGray
Push-Location $api
try {
  if (Test-Path $npxCmd) {
    & cmd /c "`"$npxCmd`" prisma generate"
  } else {
    npx prisma generate
  }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

exit 0
