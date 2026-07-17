# Refresco ligero de scripts/VERSION desde el tip de DrewRestProduccion (sin bajar el paquete de 1GB+).
# Uso (PC del restaurante, carpeta DrewRest, DETENIDO):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\bootstrap-update-scripts.ps1
# Luego:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\actualizar-drewrest.ps1 -Apply -Force

$ErrorActionPreference = "Stop"
$here = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$installRoot = Split-Path -Parent $here
. (Join-Path $here "drewrest-produccion-helpers.ps1")

Write-Host "Carpeta: $installRoot" -ForegroundColor Cyan
$ok = Install-DrewRestUpdateScriptsFromGithub -DrewRestRoot $installRoot
if (-not $ok) {
  Write-Host "No se pudieron refrescar los scripts. Revisa red a github.com." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Scripts OK. Ahora aplica el paquete completo:" -ForegroundColor Green
Write-Host "  powershell -File scripts\actualizar-drewrest.ps1 -Apply -Force"
Write-Host ""
exit 0
