# Comprueba o aplica actualizaciones del paquete DrewRest desde GitHub.
#
# Repo: https://github.com/Drew990320/DrewRestProduccion.git
#
# Uso en el PC del restaurante:
#   bin\actualizar.bat
#   bin\actualizar.bat -CheckOnly
#   bin\actualizar.bat -Apply
#
# Desde desarrollo (monorepo App):
#   npm run DrewRest:Verificar-Actualizacion
#   npm run DrewRest:Actualizar

param(
  [switch]$CheckOnly,
  [switch]$Apply,
  [switch]$Force,
  [string]$InstallPath = ""
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "drewrest-produccion-helpers.ps1")

try {
  $installRoot = Resolve-DrewRestRoot -StartPath $InstallPath
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== DrewRest - actualizaciones ===" -ForegroundColor Cyan
Write-Host "Carpeta: $installRoot"
Write-Host "Repo:    $DrewRestProduccionRepoUrlHttps"
Write-Host ""

$check = Test-DrewRestUpdateAvailable -InstallRoot $installRoot
Write-Host "Local : $(Format-DrewRestVersionLine -Manifest $check.Local)"
Write-Host "Remoto: $(Format-DrewRestVersionLine -Manifest $check.Remote)"
Write-Host ""

if ($check.Comparison.updateAvailable) {
  Write-Host $check.Comparison.message -ForegroundColor Yellow
} else {
  Write-Host $check.Comparison.message -ForegroundColor Green
}

if ($CheckOnly -or (-not $Apply -and -not $Force)) {
  if ($check.Comparison.updateAvailable) {
    Write-Host ""
    Write-Host "Para aplicar la actualizacion:" -ForegroundColor Cyan
    Write-Host "  1. bin\detener.bat"
    Write-Host "  2. bin\actualizar.bat -Apply"
    Write-Host "  3. bin\inicio.bat"
    Write-Host ""
    Write-Host "Se conservan api\.env, api\license.key e images\."
  }
  exit $(if ($check.Comparison.updateAvailable) { 2 } else { 0 })
}

if (-not $check.Comparison.updateAvailable -and -not $Force) {
  Write-Host "Nada que actualizar." -ForegroundColor Green
  exit 0
}

Write-Host ""
Write-Host "Descargando paquete desde GitHub..." -ForegroundColor Cyan
$workRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("drewrest-upd-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $workRoot | Out-Null

try {
  $source = Get-DrewRestUpdateSource -WorkDir (Join-Path $workRoot "clone")
  if (-not $source.ok) {
    $err = if ($source.error) { $source.error } else { "No se pudo descargar el paquete." }
    Write-Host $err -ForegroundColor Red
    exit 1
  }

  Write-Host "Metodo: $($source.method)" -ForegroundColor DarkGray
  Write-Host "Aplicando archivos (conservando configuracion local)..." -ForegroundColor Cyan

  $code = Invoke-DrewRestUpdateFromFolder -InstallRoot $installRoot -SourceRoot $source.path
  if ($code -ne 0) { exit $code }

  $after = Read-DrewRestVersionManifest -DrewRestRoot $installRoot
  Write-Host ""
  Write-Host "Actualizacion aplicada: $(Format-DrewRestVersionLine -Manifest $after)" -ForegroundColor Green
  Write-Host "Ejecuta bin\inicio.bat para arrancar de nuevo." -ForegroundColor Green
  Write-Host ""
  exit 0
} finally {
  Remove-Item -Path $workRoot -Recurse -Force -ErrorAction SilentlyContinue
}
