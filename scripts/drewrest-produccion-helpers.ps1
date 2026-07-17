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

  function Test-DrewRestRootCandidate([string]$dir) {
    if (-not $dir -or -not (Test-Path $dir)) { return $false }
    if (-not (Get-Item $dir).PSIsContainer) { return $false }
    return (Test-Path (Join-Path $dir "DrewRest.exe")) -or
      (Test-Path (Join-Path $dir "inicio.bat")) -or
      ((Test-Path (Join-Path $dir "api")) -and (Test-Path (Join-Path $dir "web")))
  }

  if ($StartPath -and (Test-Path $StartPath)) {
    $candidate = $StartPath
    if (Test-DrewRestRootCandidate $candidate) {
      return (Resolve-Path $candidate).Path
    }
  }

  $here = if ($StartPath) { $StartPath } else { $PSScriptRoot }
  $dir = $here
  for ($i = 0; $i -lt 6; $i++) {
    if (Test-DrewRestRootCandidate $dir) {
      return (Resolve-Path $dir).Path
    }
    $parent = Split-Path -Parent $dir
    if (-not $parent -or $parent -eq $dir) { break }
    $dir = $parent
  }

  $repoRoot = Split-Path -Parent $PSScriptRoot
  $fallback = Join-Path $repoRoot "DrewRest"
  if (Test-DrewRestRootCandidate $fallback) {
    return (Resolve-Path $fallback).Path
  }

  throw "No se encontro la carpeta DrewRest (falta DrewRest.exe o api+web). Indica -InstallPath."
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

  $migrationsDir = Join-Path $DrewRestRoot "api\prisma\migrations"
  $schemaVersion = 0
  $lastMigration = $null
  if (Test-Path $migrationsDir) {
    $migDirs = @(Get-ChildItem -Path $migrationsDir -Directory | Sort-Object Name)
    $schemaVersion = $migDirs.Count
    if ($migDirs.Count -gt 0) {
      $lastMigration = $migDirs[-1].Name
    }
  }

  $manifest = [ordered]@{
    product = "DrewRest"
    version = $version
    appVersion = $version
    buildId = $shortId
    buildDate = (Get-Date).ToString("o")
    sourceCommit = $sourceCommit
    schemaVersion = $schemaVersion
    lastMigration = $lastMigration
    configVersion = 1
    repoUrl = $DrewRestProduccionRepoUrlHttps
    branch = $DrewRestProduccionBranch
  }

  $channel = Read-DrewRestUpdateChannel -DrewRestRoot $DrewRestRoot
  if ($channel.branch -and $channel.branch -ne $DrewRestProduccionBranch) {
    $manifest.branch = $channel.branch
  }
  if ($channel.clientSlug) {
    $manifest.clientSlug = $channel.clientSlug
  }

  $json = ($manifest | ConvertTo-Json -Depth 5)
  $versionPath = Join-Path $DrewRestRoot "VERSION.json"
  Write-Utf8NoBomFile -Path $versionPath -Content $json

  $dataDir = Join-Path $DrewRestRoot "data"
  New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
  $versionsMirror = Join-Path $dataDir "versions.json"
  Write-Utf8NoBomFile -Path $versionsMirror -Content $json

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

function Get-DrewRestVersionRawUrl {
  param(
    [string]$Branch = $DrewRestProduccionBranch,
    [string]$Owner = $DrewRestProduccionOwner,
    [string]$Repo = $DrewRestProduccionRepo
  )
  return "https://raw.githubusercontent.com/$Owner/$Repo/$Branch/VERSION.json"
}

function Get-DrewRestBranchZipUrl {
  param(
    [string]$Branch = $DrewRestProduccionBranch,
    [string]$Owner = $DrewRestProduccionOwner,
    [string]$Repo = $DrewRestProduccionRepo
  )
  return "https://github.com/$Owner/$Repo/archive/refs/heads/$Branch.zip"
}

function Read-DrewRestUpdateChannel {
  param([Parameter(Mandatory = $true)][string]$DrewRestRoot)

  $channel = [ordered]@{
    branch = $DrewRestProduccionBranch
    repoUrl = $DrewRestProduccionRepoUrlHttps
    clientSlug = $null
    label = $null
  }

  $path = Join-Path $DrewRestRoot "api\update-channel.json"
  if (-not (Test-Path $path)) { return $channel }

  try {
    $json = Get-Content $path -Raw | ConvertFrom-Json
    if ($json.branch) { $channel.branch = [string]$json.branch }
    if ($json.repoUrl) { $channel.repoUrl = [string]$json.repoUrl }
    if ($json.clientSlug) { $channel.clientSlug = [string]$json.clientSlug }
    if ($json.label) { $channel.label = [string]$json.label }
  } catch {
    Write-Host "[aviso] update-channel.json invalido; se usa main." -ForegroundColor Yellow
  }

  return $channel
}

function Write-DrewRestUpdateChannel {
  param(
    [Parameter(Mandatory = $true)][string]$DrewRestRoot,
    [Parameter(Mandatory = $true)][string]$Branch,
    [string]$ClientSlug = "",
    [string]$Label = "",
    [string]$RepoUrl = $DrewRestProduccionRepoUrlHttps
  )

  $payload = [ordered]@{
    branch = $Branch
    repoUrl = $RepoUrl
  }
  if ($ClientSlug) { $payload.clientSlug = $ClientSlug }
  if ($Label) { $payload.label = $Label }

  $path = Join-Path $DrewRestRoot "api\update-channel.json"
  Write-Utf8NoBomFile -Path $path -Content ($payload | ConvertTo-Json -Depth 5)
}

function Get-RemoteDrewRestVersionManifest {
  param(
    [string]$Branch = $DrewRestProduccionBranch,
    [string]$VersionRawUrl = ""
  )
  if (-not $VersionRawUrl) {
    $VersionRawUrl = Get-DrewRestVersionRawUrl -Branch $Branch
  }
  try {
    $resp = Invoke-RestMethod -Uri $VersionRawUrl -Method Get -TimeoutSec 20
    return $resp
  } catch {
    return $null
  }
}

function Get-RemoteDrewRestCommitViaGit {
  param(
    [string]$RepoUrl = $DrewRestProduccionRepoUrlHttps,
    [string]$Branch = $DrewRestProduccionBranch
  )
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $line = git ls-remote $RepoUrl "refs/heads/$Branch" 2>$null | Select-Object -First 1
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
    $remoteNewer = $false
    if ($Local.buildDate -and $Remote.buildDate) {
      try {
        $localDt = [datetimeoffset]::Parse($Local.buildDate)
        $remoteDt = [datetimeoffset]::Parse($Remote.buildDate)
        $remoteNewer = $remoteDt -gt $localDt
      } catch {
        $remoteNewer = $false
      }
    }
    if ($remoteNewer) {
      return [ordered]@{
        status = "update_available"
        updateAvailable = $true
        message = "Hay un paquete mas reciente en el canal (misma base, nueva publicacion)."
      }
    }
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
    @{ rel = "api\update-channel.json"; required = $false },
    @{ rel = "web\web-port.txt"; required = $false },
    @{ rel = "data\pg-credentials.json"; required = $false }
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

  # Cluster PostgreSQL embebido (nunca debe perderse en una actualizacion).
  $dataPg = Join-Path $DrewRestRoot "data\postgres"
  if (Test-Path $dataPg) {
    Copy-Item -Path $dataPg -Destination (Join-Path $temp "data\postgres") -Recurse -Force
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
  param(
    [Parameter(Mandatory = $true)][string]$DrewRestRoot,
    [string]$ScriptsSource = ""
  )

  if (-not $ScriptsSource) {
    $ScriptsSource = $PSScriptRoot
  }

  $scriptsDst = Join-Path $DrewRestRoot "scripts"
  New-Item -ItemType Directory -Force -Path $scriptsDst | Out-Null

  $files = @(
    "actualizar-drewrest.ps1",
    "drewrest-produccion-config.ps1",
    "drewrest-produccion-helpers.ps1"
  )
  foreach ($name in $files) {
    $src = Join-Path $ScriptsSource $name
    $dst = Join-Path $scriptsDst $name
    if (-not (Test-Path $src)) { continue }
    $srcFull = [System.IO.Path]::GetFullPath($src)
    $dstFull = [System.IO.Path]::GetFullPath($dst)
    if ($srcFull.Equals($dstFull, [StringComparison]::OrdinalIgnoreCase)) { continue }
    Copy-Item -Path $src -Destination $dst -Force
  }

  $lifecycleSrc = Join-Path $ScriptsSource "lifecycle"
  if (Test-Path $lifecycleSrc) {
    $lifecycleDst = Join-Path $scriptsDst "lifecycle"
    New-Item -ItemType Directory -Force -Path $lifecycleDst | Out-Null
    Copy-Item -Path (Join-Path $lifecycleSrc "*") -Destination $lifecycleDst -Recurse -Force
  }

  $binDst = Join-Path $DrewRestRoot "bin"
  if (Test-Path $binDst) {
    foreach ($stale in @(
        "inicio.bat", "detener.bat", "detener.vbs", "actualizar.bat",
        "reparar-api.bat", "ejecutar-baseline-prisma.bat",
        "mostrar-id-maquina.bat", "configurar-base.bat"
      )) {
      $p = Join-Path $binDst $stale
      if (Test-Path $p) {
        Remove-Item $p -Force -ErrorAction SilentlyContinue
      }
    }
  }
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
    $scriptsFromPackage = Join-Path $SourceRoot "scripts"
    $scriptsSource = if (Test-Path $scriptsFromPackage) { $scriptsFromPackage } else { $PSScriptRoot }
    Install-DrewRestUpdateScripts -DrewRestRoot $InstallRoot -ScriptsSource $scriptsSource
    return 0
  } finally {
    Remove-Item -Path $backup -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Get-DrewRestUpdateSource {
  param(
    [string]$RepoUrl = $DrewRestProduccionRepoUrlHttps,
    [string]$Branch = $DrewRestProduccionBranch,
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
    git clone --depth 1 --branch $Branch $RepoUrl $WorkDir 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $gitOk = $true
    }
  }
  $ErrorActionPreference = $prev

  if ($gitOk) {
    return @{ ok = $true; path = $WorkDir; method = "git"; branch = $Branch }
  }

  $zipUrl = Get-DrewRestBranchZipUrl -Branch $Branch
  $zipPath = Join-Path $WorkDir "package.zip"
  try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -TimeoutSec 120
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

  $channel = Read-DrewRestUpdateChannel -DrewRestRoot $InstallRoot
  $branch = $channel.branch
  $repoUrl = $channel.repoUrl
  $versionRawUrl = Get-DrewRestVersionRawUrl -Branch $branch

  $local = Read-DrewRestVersionManifest -DrewRestRoot $InstallRoot
  $remote = Get-RemoteDrewRestVersionManifest -Branch $branch -VersionRawUrl $versionRawUrl
  if (-not $remote) {
    $remoteCommit = Get-RemoteDrewRestCommitViaGit -RepoUrl $repoUrl -Branch $branch
    if ($remoteCommit) {
      $remote = [pscustomobject]@{
        buildId = $remoteCommit.Substring(0, [Math]::Min(7, $remoteCommit.Length))
        sourceCommit = $remoteCommit
        version = "?"
        buildDate = "?"
        publishBranch = $branch
      }
    }
  }

  $cmp = Compare-DrewRestVersions -Local $local -Remote $remote
  return [pscustomobject]@{
    Local = $local
    Remote = $remote
    Comparison = $cmp
    Channel = $channel
  }
}
