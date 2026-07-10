# Utilidades para versionado, comparacion y actualizacion del paquete DrewRest on-prem.

. (Join-Path $PSScriptRoot "drewrest-produccion-config.ps1")

function Write-Utf8NoBomFile {
  param([string]$Path, [string]$Content)
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Resolve-DrewRestRoot {
  param([string]$StartPath = "")
  if ($StartPath -and (Test-Path $StartPath)) {
    $candidate = $StartPath
    if ((Get-Item $candidate).PSIsContainer -and (Test-Path (Join-Path $candidate "inicio.bat"))) {
      return (Resolve-Path $candidate).Path
    }
  }

  $here = if ($StartPath) { $StartPath } else { $PSScriptRoot }
  $dir = $here
  for ($i = 0; $i -lt 6; $i++) {
    if (Test-Path (Join-Path $dir "inicio.bat")) {
      return (Resolve-Path $dir).Path
    }
    $parent = Split-Path -Parent $dir
    if (-not $parent -or $parent -eq $dir) { break }
    $dir = $parent
  }

  $repoRoot = Split-Path -Parent $PSScriptRoot
  $fallback = Join-Path $repoRoot "DrewRest"
  if (Test-Path (Join-Path $fallback "inicio.bat")) {
    return (Resolve-Path $fallback).Path
  }

  throw "No se encontro la carpeta DrewRest (falta inicio.bat). Indica -InstallPath."
}

function Get-DrewRestSourceCommit {
  param([string]$RepoRoot)
  Push-Location $RepoRoot
  try {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $hash = (git rev-parse HEAD 2>$null)
    $ErrorActionPreference = $prev
    if ($hash) { return $hash.Trim() }
    return "unknown"
  } finally {
    Pop-Location
  }
}

function New-DrewRestVersionManifest {
  param(
    [Parameter(Mandatory = $true)][string]$DrewRestRoot,
    [Parameter(Mandatory = $true)][string]$AppRepoRoot
  )

  $apiPkgPath = Join-Path $DrewRestRoot "api\package.json"
  $version = "0.0.0"
  if (Test-Path $apiPkgPath) {
    $apiPkg = Get-Content $apiPkgPath -Raw | ConvertFrom-Json
    if ($apiPkg.version) { $version = [string]$apiPkg.version }
  }

  $sourceCommit = Get-DrewRestSourceCommit -RepoRoot $AppRepoRoot
  $shortId = if ($sourceCommit -ne "unknown" -and $sourceCommit.Length -ge 7) {
    $sourceCommit.Substring(0, 7)
  } else {
    (Get-Date -Format "yyyyMMddHHmmss")
  }

  $manifest = [ordered]@{
    product = "DrewRest"
    version = $version
    buildId = $shortId
    buildDate = (Get-Date).ToString("o")
    sourceCommit = $sourceCommit
    repoUrl = $DrewRestProduccionRepoUrlHttps
    branch = $DrewRestProduccionBranch
  }

  $json = ($manifest | ConvertTo-Json -Depth 5)
  $versionPath = Join-Path $DrewRestRoot "VERSION.json"
  Write-Utf8NoBomFile -Path $versionPath -Content $json
  return $manifest
}

function Read-DrewRestVersionManifest {
  param([Parameter(Mandatory = $true)][string]$DrewRestRoot)
  $path = Join-Path $DrewRestRoot "VERSION.json"
  if (-not (Test-Path $path)) { return $null }
  try {
    return (Get-Content $path -Raw | ConvertFrom-Json)
  } catch {
    return $null
  }
}

function Get-RemoteDrewRestVersionManifest {
  try {
    $resp = Invoke-RestMethod -Uri $DrewRestProduccionVersionRawUrl -Method Get -TimeoutSec 20
    return $resp
  } catch {
    return $null
  }
}

function Get-RemoteDrewRestCommitViaGit {
  param([string]$RepoUrl = $DrewRestProduccionRepoUrlHttps)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $line = git ls-remote $RepoUrl "refs/heads/$DrewRestProduccionBranch" 2>$null | Select-Object -First 1
    if (-not $line) { return $null }
    return ($line -split "\s+")[0]
  } finally {
    $ErrorActionPreference = $prev
  }
}

function Compare-DrewRestVersions {
  param(
    $Local,
    $Remote
  )

  if (-not $Remote) {
    return [ordered]@{
      status = "unknown"
      updateAvailable = $false
      message = "No se pudo consultar la version remota (repo vacio o sin red)."
    }
  }

  if (-not $Local) {
    return [ordered]@{
      status = "remote_only"
      updateAvailable = $true
      message = "Instalacion sin VERSION.json. Hay paquete publicado en GitHub."
    }
  }

  $sameBuild = ($Local.buildId -eq $Remote.buildId) -or (
    $Local.sourceCommit -and $Remote.sourceCommit -and
    $Local.sourceCommit -eq $Remote.sourceCommit
  )

  if ($sameBuild) {
    return [ordered]@{
      status = "current"
      updateAvailable = $false
      message = "Ya tienes la ultima version publicada."
    }
  }

  return [ordered]@{
    status = "update_available"
    updateAvailable = $true
    message = "Hay una version mas reciente en DrewRestProduccion."
  }
}

function Format-DrewRestVersionLine {
  param($Manifest)
  if (-not $Manifest) { return "(sin VERSION.json)" }
  $date = if ($Manifest.buildDate) { $Manifest.buildDate } else { "?" }
  return "v$($Manifest.version) | build $($Manifest.buildId) | $date"
}

function Backup-DrewRestProtectedFiles {
  param([Parameter(Mandatory = $true)][string]$DrewRestRoot)
  $temp = Join-Path ([System.IO.Path]::GetTempPath()) ("drewrest-update-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Force -Path $temp | Out-Null

  $map = @(
    @{ rel = "api\.env"; required = $false },
    @{ rel = "api\license.key"; required = $false },
    @{ rel = "web\web-port.txt"; required = $false }
  )

  foreach ($item in $map) {
    $src = Join-Path $DrewRestRoot $item.rel
    if (Test-Path $src) {
      $dst = Join-Path $temp $item.rel
      $dstDir = Split-Path -Parent $dst
      New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
      Copy-Item -Path $src -Destination $dst -Force
    }
  }

  $imagesSrc = Join-Path $DrewRestRoot "images"
  if (Test-Path $imagesSrc) {
    Copy-Item -Path $imagesSrc -Destination (Join-Path $temp "images") -Recurse -Force
  }

  return $temp
}

function Restore-DrewRestProtectedFiles {
  param(
    [Parameter(Mandatory = $true)][string]$DrewRestRoot,
    [Parameter(Mandatory = $true)][string]$BackupRoot
  )

  if (-not (Test-Path $BackupRoot)) { return }

  Get-ChildItem -Path $BackupRoot -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($BackupRoot.Length).TrimStart('\', '/')
    $target = Join-Path $DrewRestRoot $rel
    $targetDir = Split-Path -Parent $target
    if ($targetDir -and -not (Test-Path $targetDir)) {
      New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    }
    Copy-Item -Path $_.FullName -Destination $target -Force
  }
}

function Copy-DrewRestTree {
  param(
    [Parameter(Mandatory = $true)][string]$SourceRoot,
    [Parameter(Mandatory = $true)][string]$TargetRoot
  )

  Get-ChildItem -Path $SourceRoot -Force | ForEach-Object {
    if ($_.Name -eq ".git") { return }
    $target = Join-Path $TargetRoot $_.Name
    if ($_.PSIsContainer) {
      if (Test-Path $target) {
        Copy-Item -Path (Join-Path $_.FullName "*") -Destination $target -Recurse -Force
      } else {
        Copy-Item -Path $_.FullName -Destination $target -Recurse -Force
      }
    } else {
      Copy-Item -Path $_.FullName -Destination $target -Force
    }
  }
}

function Install-DrewRestUpdateScripts {
  param([Parameter(Mandatory = $true)][string]$DrewRestRoot)

  $scriptsDst = Join-Path $DrewRestRoot "scripts"
  New-Item -ItemType Directory -Force -Path $scriptsDst | Out-Null

  $files = @(
    "actualizar-drewrest.ps1",
    "drewrest-produccion-config.ps1",
    "drewrest-produccion-helpers.ps1"
  )
  foreach ($name in $files) {
    $src = Join-Path $PSScriptRoot $name
    if (Test-Path $src) {
      Copy-Item -Path $src -Destination (Join-Path $scriptsDst $name) -Force
    }
  }

  $binDst = Join-Path $DrewRestRoot "bin\actualizar.bat"
  $bat = @"
@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "ROOT=%~dp0.."
cd /d "%ROOT%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\actualizar-drewrest.ps1" %*
if errorlevel 1 pause
"@
  Write-Utf8NoBomFile -Path $binDst -Content $bat
}

function Invoke-DrewRestUpdateFromFolder {
  param(
    [Parameter(Mandatory = $true)][string]$InstallRoot,
    [Parameter(Mandatory = $true)][string]$SourceRoot
  )

  $backup = Backup-DrewRestProtectedFiles -DrewRestRoot $InstallRoot
  try {
    Copy-DrewRestTree -SourceRoot $SourceRoot -TargetRoot $InstallRoot
    Restore-DrewRestProtectedFiles -DrewRestRoot $InstallRoot -BackupRoot $backup
    Install-DrewRestUpdateScripts -DrewRestRoot $InstallRoot
    return 0
  } finally {
    Remove-Item -Path $backup -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Get-DrewRestUpdateSource {
  param(
    [string]$RepoUrl = $DrewRestProduccionRepoUrlHttps,
    [string]$WorkDir = ""
  )

  if (-not $WorkDir) {
    $WorkDir = Join-Path ([System.IO.Path]::GetTempPath()) ("drewrest-src-" + [guid]::NewGuid().ToString("N"))
  }
  New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null

  $gitOk = $false
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  git --version 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    git clone --depth 1 --branch $DrewRestProduccionBranch $RepoUrl $WorkDir 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $gitOk = $true
    }
  }
  $ErrorActionPreference = $prev

  if ($gitOk) {
    return @{ ok = $true; path = $WorkDir; method = "git" }
  }

  $zipPath = Join-Path $WorkDir "package.zip"
  try {
    Invoke-WebRequest -Uri $DrewRestProduccionZipUrl -OutFile $zipPath -TimeoutSec 120
    Expand-Archive -Path $zipPath -DestinationPath $WorkDir -Force
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    $extracted = Get-ChildItem -Path $WorkDir -Directory |
      Where-Object { $_.Name -like "$DrewRestProduccionRepo-*" } |
      Select-Object -First 1
    if (-not $extracted) {
      return @{ ok = $false; path = $WorkDir; method = "zip"; error = "No se encontro la carpeta extraida del ZIP." }
    }
    return @{ ok = $true; path = $extracted.FullName; method = "zip" }
  } catch {
    return @{ ok = $false; path = $WorkDir; method = "zip"; error = $_.Exception.Message }
  }
}

function Test-DrewRestUpdateAvailable {
  param([Parameter(Mandatory = $true)][string]$InstallRoot)

  $local = Read-DrewRestVersionManifest -DrewRestRoot $InstallRoot
  $remote = Get-RemoteDrewRestVersionManifest
  if (-not $remote) {
    $remoteCommit = Get-RemoteDrewRestCommitViaGit
    if ($remoteCommit) {
      $remote = [pscustomobject]@{
        buildId = $remoteCommit.Substring(0, [Math]::Min(7, $remoteCommit.Length))
        sourceCommit = $remoteCommit
        version = "?"
        buildDate = "?"
      }
    }
  }

  $cmp = Compare-DrewRestVersions -Local $local -Remote $remote
  return [pscustomobject]@{
    Local = $local
    Remote = $remote
    Comparison = $cmp
  }
}
