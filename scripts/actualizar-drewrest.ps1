# Comprueba o aplica actualizaciones del paquete DrewRest desde GitHub.
#
# Repo: https://github.com/Drew990320/DrewRestProduccion.git
#
# Uso en el PC del restaurante:
#   inicio.bat                    (pregunta si hay actualizacion)
#   inicio.bat actualizar         (instala y arranca)
#   inicio.bat sinactualizar      (arranca sin comprobar)
#
# Compatibilidad: bin\actualizar.bat redirige a inicio.bat actualizar
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
$check = Test-DrewRestUpdateAvailable -InstallRoot $installRoot
$channel = $check.Channel
Write-Host "Canal:   $($channel.branch)$(if ($channel.label) { " ($($channel.label))" })"
Write-Host "Repo:    $($channel.repoUrl)"
Write-Host ""

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
    Write-Host "  inicio.bat actualizar"
    Write-Host "  (o cierra y vuelve a abrir DrewRest; al arrancar te preguntara)"
    Write-Host ""
    Write-Host "Se conservan api\.env, api\license.key, images\ y data\ (Postgres embebido)."
    Write-Host "Preferible: DrewRest.exe actualizar"
  }
  exit $(if ($check.Comparison.updateAvailable) { 2 } else { 0 })
}

# No degradar: Force reinstala solo si remoto >= local (updateAvailable) o forzar mismo build.
if ($check.Comparison.status -eq "local_ahead") {
  Write-Host "No se aplica: la instalacion local es mas nueva que el canal remoto." -ForegroundColor Yellow
  exit 0
}

if (-not $check.Comparison.updateAvailable -and -not $Force) {
  Write-Host "Nada que actualizar." -ForegroundColor Green
  exit 0
}

if (-not $check.Comparison.updateAvailable -and $Force) {
  Write-Host "Force: reinstalando el paquete remoto actual..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Descargando paquete desde GitHub..." -ForegroundColor Cyan

# Primero scripts/VERSION (ligero): el PC remoto recupera el motor de update aunque el ZIP grande falle.
[void](Install-DrewRestUpdateScriptsFromGithub -DrewRestRoot $installRoot -Branch $channel.branch)

$workRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("drewrest-upd-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $workRoot | Out-Null

try {
  $source = Get-DrewRestUpdateSource `
    -RepoUrl $channel.repoUrl `
    -Branch $channel.branch `
    -WorkDir (Join-Path $workRoot "clone")
  if (-not $source.ok) {
    $err = if ($source.error) { $source.error } else { "No se pudo descargar el paquete." }
    Write-Host $err -ForegroundColor Red
    Write-Host "Los scripts de update ya se intentaron refrescar. Revisa red/Git e intenta de nuevo." -ForegroundColor Yellow
    exit 1
  }

  Write-Host "Metodo: $($source.method)" -ForegroundColor DarkGray
  Write-Host "Aplicando archivos (conservando configuracion local)..." -ForegroundColor Cyan

  $code = Invoke-DrewRestUpdateFromFolder -InstallRoot $installRoot -SourceRoot $source.path
  if ($code -ne 0) { exit $code }

  $after = Read-DrewRestVersionManifest -DrewRestRoot $installRoot
  Write-Host ""
  Write-Host "Actualizacion aplicada: $(Format-DrewRestVersionLine -Manifest $after)" -ForegroundColor Green
  Write-Host ""
  exit 0
} finally {
  Remove-Item -Path $workRoot -Recurse -Force -ErrorAction SilentlyContinue
}
