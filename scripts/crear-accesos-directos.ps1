# Crea accesos directos de DrewRest en el escritorio del usuario actual.
param([string]$InstallRoot = "")

$ErrorActionPreference = "Stop"

if ($InstallRoot) {
  $root = (Resolve-Path $InstallRoot).Path
} else {
  $root = Split-Path -Parent $PSScriptRoot
}

$icon = Join-Path $root "icon.ico"
if (-not (Test-Path $icon)) {
  $icon = Join-Path $root "web\favicon.ico"
}

$desktop = [Environment]::GetFolderPath("Desktop")
$shell = New-Object -ComObject WScript.Shell

function New-Shortcut {
  param(
    [string]$Name,
    [string]$Target,
    [string]$Arguments = "",
    [string]$Description
  )
  $lnk = Join-Path $desktop "$Name.lnk"
  $sc = $shell.CreateShortcut($lnk)
  $sc.TargetPath = $Target
  if ($Arguments) { $sc.Arguments = $Arguments }
  $sc.WorkingDirectory = $root
  if (Test-Path $icon) { $sc.IconLocation = "$icon,0" }
  $sc.Description = $Description
  $sc.Save()
  Write-Host "  $lnk" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== DrewRest - accesos directos ===" -ForegroundColor Cyan
Write-Host "Escritorio: $desktop"
Write-Host ""

$exe = Join-Path $root "DrewRest.exe"
$abrirVbs = Join-Path $root "abrir-drewrest.vbs"
$detenerBat = Join-Path $root "detener.bat"

if (Test-Path $exe) {
  New-Shortcut -Name "DrewRest" `
    -Target $exe `
    -Description "Abrir panel de control DrewRest"
} elseif (Test-Path $abrirVbs) {
  $wscript = Join-Path $env:WINDIR "System32\wscript.exe"
  New-Shortcut -Name "DrewRest" `
    -Target $wscript `
    -Arguments "`"$abrirVbs`"" `
    -Description "Abrir DrewRest"
} else {
  throw "No se encuentra DrewRest.exe ni abrir-drewrest.vbs en $root"
}

if (Test-Path $detenerBat) {
  New-Shortcut -Name "DrewRest - Detener" `
    -Target $detenerBat `
    -Description "Detener servicios DrewRest"
}

Write-Host ""
Write-Host "Listo. Usa el icono DrewRest en el escritorio." -ForegroundColor Green
Write-Host ""
