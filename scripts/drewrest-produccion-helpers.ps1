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

  # Version de publicacion (CalVer): cambia en CADA empaquetado aunque package.json
  # siga en 0.0.1. No dependemos de tags de Git — el cliente compara VERSION.json.
  $now = Get-Date
  $publishVersion = $now.ToString("yyyy.M.d.HHmm")

  $apiPkgPath = Join-Path $DrewRestRoot "api\package.json"
  $packageVersion = "0.0.0"
  if (Test-Path $apiPkgPath) {
    $apiPkg = Get-Content $apiPkgPath -Raw | ConvertFrom-Json
    if ($apiPkg.version) { $packageVersion = [string]$apiPkg.version }
  }

  $sourceCommit = Get-DrewRestSourceCommit -RepoRoot $AppRepoRoot
  $shortId = if ($sourceCommit -ne "unknown" -and $sourceCommit.Length -ge 7) {
    $sourceCommit.Substring(0, 7)
  } else {
    $now.ToString("yyyyMMddHHmmss")
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
    version = $publishVersion
    appVersion = $publishVersion
    packageVersion = $packageVersion
    buildId = $shortId
    buildDate = $now.ToString("o")
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

function Install-DrewRestGithubWorkflow {
  param(
    [Parameter(Mandatory = $true)][string]$DrewRestRoot,
    [string]$TemplatesRoot = ""
  )

  if (-not $TemplatesRoot) {
    $TemplatesRoot = Join-Path $PSScriptRoot "templates\drewrest-github"
  }
  $src = Join-Path $TemplatesRoot "release-on-version.yml"
  if (-not (Test-Path $src)) { return $false }

  $dstDir = Join-Path $DrewRestRoot ".github\workflows"
  New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
  $dst = Join-Path $dstDir "release-on-version.yml"
  Copy-Item -Path $src -Destination $dst -Force
  return $true
}

function Get-DrewRestGithubApiHeaders {
  return @{
    "User-Agent" = "DrewRest-Updater"
    "Accept" = "application/vnd.github+json"
    "Cache-Control" = "no-cache"
    "Pragma" = "no-cache"
  }
}

# Ultimo GitHub Release (publico). Null si no hay releases.
function Get-LatestDrewRestGithubRelease {
  param(
    [string]$Owner = $DrewRestProduccionOwner,
    [string]$Repo = $DrewRestProduccionRepo
  )

  $headers = Get-DrewRestGithubApiHeaders
  try {
    $latestUrl = "https://api.github.com/repos/$Owner/$Repo/releases/latest"
    return Invoke-RestMethod -Uri $latestUrl -Method Get -TimeoutSec 25 -Headers $headers
  } catch {
    # 404 = aún no hay releases
  }

  try {
    $listUrl = "https://api.github.com/repos/$Owner/$Repo/releases?per_page=5"
    $list = Invoke-RestMethod -Uri $listUrl -Method Get -TimeoutSec 25 -Headers $headers
    if ($list -is [System.Array] -and $list.Count -gt 0) {
      return $list | Where-Object { -not $_.draft -and -not $_.prerelease } | Select-Object -First 1
    }
    if ($list -and -not ($list -is [System.Array])) { return $list }
  } catch {
    return $null
  }
  return $null
}

function Get-RemoteDrewRestVersionFromRelease {
  param(
    [string]$Owner = $DrewRestProduccionOwner,
    [string]$Repo = $DrewRestProduccionRepo
  )

  $release = Get-LatestDrewRestGithubRelease -Owner $Owner -Repo $Repo
  if (-not $release) { return $null }

  $headers = Get-DrewRestGithubApiHeaders
  $asset = $null
  if ($release.assets) {
    $asset = @($release.assets) | Where-Object { $_.name -eq "VERSION.json" } | Select-Object -First 1
  }

  $manifest = $null
  if ($asset -and $asset.browser_download_url) {
    try {
      $manifest = Invoke-RestMethod -Uri $asset.browser_download_url -Method Get -TimeoutSec 25 -Headers $headers
    } catch {
      $manifest = $null
    }
  }

  if (-not $manifest -and $release.tag_name) {
    # Fallback mínimo desde el tag (v2026.7.17.1350 → 2026.7.17.1350)
    $tagVer = [string]$release.tag_name
    if ($tagVer.StartsWith("v")) { $tagVer = $tagVer.Substring(1) }
    $manifest = [pscustomobject]@{
      version = $tagVer
      appVersion = $tagVer
      buildId = $release.target_commitish
      buildDate = $release.published_at
      sourceCommit = $release.target_commitish
    }
  }

  if (-not $manifest) { return $null }

  try {
    $manifest | Add-Member -NotePropertyName releaseTag -NotePropertyValue $release.tag_name -Force
    $manifest | Add-Member -NotePropertyName releaseUrl -NotePropertyValue $release.html_url -Force
    $manifest | Add-Member -NotePropertyName updateChannel -NotePropertyValue "github-release" -Force
  } catch {}

  return $manifest
}

function Get-RemoteDrewRestVersionManifest {
  param(
    [string]$Branch = $DrewRestProduccionBranch,
    [string]$VersionRawUrl = "",
    [string]$RepoUrl = $DrewRestProduccionRepoUrlHttps,
    [string]$Owner = $DrewRestProduccionOwner,
    [string]$Repo = $DrewRestProduccionRepo
  )

  # 1) GitHub Releases (sin caché de raw.../main/; canal preferido).
  $fromRelease = Get-RemoteDrewRestVersionFromRelease -Owner $Owner -Repo $Repo
  if ($fromRelease) { return $fromRelease }

  # 2) Tip real de la rama (evita caché de raw.../main/VERSION.json).
  $tipSha = Get-RemoteDrewRestCommitViaGit -RepoUrl $RepoUrl -Branch $Branch
  if ($tipSha) {
    $byCommit = "https://raw.githubusercontent.com/$Owner/$Repo/$tipSha/VERSION.json"
    try {
      $sep = "?"
      $uri = "$byCommit$sep`_=$(Get-Date -UFormat %s)"
      $headers = @{
        "Cache-Control" = "no-cache"
        "Pragma" = "no-cache"
      }
      $resp = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 20 -Headers $headers
      if ($resp) {
        if (-not $resp.publishCommit) {
          try { $resp | Add-Member -NotePropertyName publishCommit -NotePropertyValue $tipSha -Force } catch {}
        }
        try { $resp | Add-Member -NotePropertyName updateChannel -NotePropertyValue "git-tip" -Force } catch {}
        return $resp
      }
    } catch {
      # sigue a fallbacks
    }

    # API de GitHub (menos agresiva en caché que raw por rama).
    try {
      $apiUri = "https://api.github.com/repos/$Owner/$Repo/contents/VERSION.json?ref=$tipSha"
      $apiHeaders = @{
        "Accept" = "application/vnd.github.raw+json"
        "User-Agent" = "DrewRest-Updater"
        "Cache-Control" = "no-cache"
      }
      $resp = Invoke-RestMethod -Uri $apiUri -Method Get -TimeoutSec 20 -Headers $apiHeaders
      if ($resp) {
        try { $resp | Add-Member -NotePropertyName updateChannel -NotePropertyValue "git-tip" -Force } catch {}
        return $resp
      }
    } catch {
      # sigue a fallbacks
    }
  }

  # 3) Fallback: URL por rama (puede estar cacheada).
  if (-not $VersionRawUrl) {
    $VersionRawUrl = Get-DrewRestVersionRawUrl -Branch $Branch
  }
  try {
    $sep = if ($VersionRawUrl.Contains("?")) { "&" } else { "?" }
    $uri = "$VersionRawUrl$sep`_=$(Get-Date -UFormat %s)"
    $headers = @{
      "Cache-Control" = "no-cache"
      "Pragma" = "no-cache"
    }
    $resp = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 20 -Headers $headers
    if ($resp) {
      try { $resp | Add-Member -NotePropertyName updateChannel -NotePropertyValue "raw-branch" -Force } catch {}
    }
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

function ConvertTo-DrewRestVersionRank {
  param($Manifest)
  # Rank comparable: prefer buildDate ticks; fallback CalVer numerico; else 0.
  if ($Manifest -and $Manifest.buildDate) {
    try {
      return [datetimeoffset]::Parse([string]$Manifest.buildDate).UtcTicks
    } catch {}
  }
  $ver = if ($Manifest) { [string]$Manifest.version } else { "" }
  if (-not $ver) { return [int64]0 }
  $parts = $ver.Split('.') | ForEach-Object {
    $n = 0
    [void][int]::TryParse($_, [ref]$n)
    $n
  }
  # yyyy.M.d.HHmm → compacto en un Int64
  while ($parts.Count -lt 4) { $parts += 0 }
  return [int64](
    ([int64]$parts[0] * 1000000000000L) +
    ([int64]$parts[1] * 1000000000L) +
    ([int64]$parts[2] * 1000000L) +
    ([int64]$parts[3])
  )
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

  $sameBuild = ($Local.buildId -and $Remote.buildId -and ($Local.buildId -eq $Remote.buildId)) -or (
    $Local.sourceCommit -and $Remote.sourceCommit -and
    $Local.sourceCommit -eq $Remote.sourceCommit -and
    $Local.version -eq $Remote.version
  )

  if ($sameBuild) {
    return [ordered]@{
      status = "current"
      updateAvailable = $false
      message = "Ya tienes la ultima version publicada (v$($Local.version) / build $($Local.buildId))."
    }
  }

  $localRank = ConvertTo-DrewRestVersionRank $Local
  $remoteRank = ConvertTo-DrewRestVersionRank $Remote
  $channelHint = ""
  if ($Remote.updateChannel) { $channelHint = " [$($Remote.updateChannel)]" }
  if ($Remote.releaseTag) { $channelHint += " $($Remote.releaseTag)" }

  if ($remoteRank -gt $localRank) {
    return [ordered]@{
      status = "update_available"
      updateAvailable = $true
      message = "Hay una version mas reciente en DrewRestProduccion (v$($Remote.version) / build $($Remote.buildId))$channelHint."
    }
  }

  if ($localRank -gt $remoteRank) {
    return [ordered]@{
      status = "local_ahead"
      updateAvailable = $false
      message = "Esta instalacion (v$($Local.version)) es mas nueva que el remoto (v$($Remote.version)). No hay que actualizar."
    }
  }

  # Misma fecha/version distinta buildId: preferir remoto solo si buildId difiere y fechas iguales → update
  if ($Local.buildId -ne $Remote.buildId) {
    return [ordered]@{
      status = "update_available"
      updateAvailable = $true
      message = "Hay un paquete distinto en DrewRestProduccion (v$($Remote.version) / build $($Remote.buildId))$channelHint."
    }
  }

  return [ordered]@{
    status = "current"
    updateAvailable = $false
    message = "Ya tienes la ultima version publicada (v$($Local.version) / build $($Local.buildId))."
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

function Stop-DrewRestRuntimeLocks {
  param([Parameter(Mandatory = $true)][string]$DrewRestRoot)

  $rootFull = [System.IO.Path]::GetFullPath($DrewRestRoot).TrimEnd('\')
  $killed = 0
  try {
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
      $cmd = [string]$_.CommandLine
      $exe = [string]$_.ExecutablePath
      if (
        ($cmd -and $cmd.IndexOf($rootFull, [StringComparison]::OrdinalIgnoreCase) -ge 0) -or
        ($exe -and $exe.IndexOf($rootFull, [StringComparison]::OrdinalIgnoreCase) -ge 0)
      ) {
        try {
          Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
          $killed++
        } catch {}
      }
    }
  } catch {}

  if ($killed -gt 0) {
    Write-Host "Procesos node liberados para actualizar: $killed" -ForegroundColor DarkGray
    Start-Sleep -Seconds 2
  }
}

function Copy-DrewRestTree {
  param(
    [Parameter(Mandatory = $true)][string]$SourceRoot,
    [Parameter(Mandatory = $true)][string]$TargetRoot
  )

  # Robocopy tolera reintentos; evita tumbar todo el update por un .dll de Prisma bloqueado.
  $xd = @("/XD", ".git")
  foreach ($rel in @(
      "data\postgres",
      "data\backups",
      "data\staging",
      "data\state",
      "api\logs"
    )) {
    $srcEx = Join-Path $SourceRoot $rel
    if (Test-Path $srcEx) {
      $xd += "/XD"
      $xd += $srcEx
    }
  }

  $args = @(
    $SourceRoot, $TargetRoot,
    "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np",
    "/R:4", "/W:2", "/XJ"
  ) + $xd

  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & robocopy @args | Out-Null
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev

  # Robocopy: 0-7 = exito/parcial; >=8 error grave
  if ($code -ge 8) {
    throw "No se pudieron copiar archivos de actualizacion (robocopy $code). Deten el API (boton Detener) e intenta de nuevo."
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
    "drewrest-produccion-helpers.ps1",
    "bootstrap-update-scripts.ps1"
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

  Stop-DrewRestRuntimeLocks -DrewRestRoot $InstallRoot
  $backup = Backup-DrewRestProtectedFiles -DrewRestRoot $InstallRoot
  try {
    Copy-DrewRestTree -SourceRoot $SourceRoot -TargetRoot $InstallRoot
    Restore-DrewRestProtectedFiles -DrewRestRoot $InstallRoot -BackupRoot $backup
    $scriptsFromPackage = Join-Path $SourceRoot "scripts"
    $scriptsSource = if (Test-Path $scriptsFromPackage) { $scriptsFromPackage } else { $PSScriptRoot }
    Install-DrewRestUpdateScripts -DrewRestRoot $InstallRoot -ScriptsSource $scriptsSource
    return 0
  } catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    return 1
  } finally {
    Remove-Item -Path $backup -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Install-DrewRestUpdateScriptsFromGithub {
  param(
    [Parameter(Mandatory = $true)][string]$DrewRestRoot,
    [string]$Branch = $DrewRestProduccionBranch,
    [string]$Owner = $DrewRestProduccionOwner,
    [string]$Repo = $DrewRestProduccionRepo
  )

  $tipSha = Get-RemoteDrewRestCommitViaGit -Branch $Branch
  if (-not $tipSha) {
    Write-Host "No se pudo resolver el tip de $Branch para scripts." -ForegroundColor Yellow
    return $false
  }

  Write-Host "Actualizando scripts de update desde GitHub ($($tipSha.Substring(0,7)))..." -ForegroundColor Cyan
  $base = "https://raw.githubusercontent.com/$Owner/$Repo/$tipSha"
  $scriptsDst = Join-Path $DrewRestRoot "scripts"
  New-Item -ItemType Directory -Force -Path $scriptsDst | Out-Null

  $files = @(
    @{ rel = "scripts/actualizar-drewrest.ps1"; dst = (Join-Path $scriptsDst "actualizar-drewrest.ps1") },
    @{ rel = "scripts/drewrest-produccion-helpers.ps1"; dst = (Join-Path $scriptsDst "drewrest-produccion-helpers.ps1") },
    @{ rel = "scripts/drewrest-produccion-config.ps1"; dst = (Join-Path $scriptsDst "drewrest-produccion-config.ps1") },
    @{ rel = "VERSION.json"; dst = (Join-Path $DrewRestRoot "VERSION.json") }
  )

  $headers = @{
    "User-Agent" = "DrewRest-Updater"
    "Cache-Control" = "no-cache"
  }
  $ok = 0
  foreach ($f in $files) {
    try {
      $uri = "$base/$($f.rel)?_=$(Get-Date -UFormat %s)"
      Invoke-WebRequest -Uri $uri -OutFile $f.dst -Headers $headers -TimeoutSec 60 -UseBasicParsing
      $ok++
    } catch {
      Write-Host "  No se pudo bajar $($f.rel): $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }

  # Workflow (opcional)
  try {
    $wfDir = Join-Path $DrewRestRoot ".github\workflows"
    New-Item -ItemType Directory -Force -Path $wfDir | Out-Null
    $wfUri = "$base/.github/workflows/release-on-version.yml?_=$(Get-Date -UFormat %s)"
    Invoke-WebRequest -Uri $wfUri -OutFile (Join-Path $wfDir "release-on-version.yml") -Headers $headers -TimeoutSec 60 -UseBasicParsing
  } catch {}

  Write-Host "Scripts ligeros actualizados: $ok/$($files.Count)" -ForegroundColor DarkGray
  return ($ok -ge 3)
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
    Write-Host "Clonando paquete desde GitHub (depth 1). Puede tardar varios minutos..." -ForegroundColor Cyan
    $env:GIT_TERMINAL_PROMPT = "0"
    git -c advice.detachedHead=false clone --depth 1 --branch $Branch --single-branch $RepoUrl $WorkDir 2>&1 | ForEach-Object {
      Write-Host "  $_" -ForegroundColor DarkGray
    }
    if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $WorkDir "VERSION.json"))) {
      $gitOk = $true
    } elseif ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $WorkDir "DrewRest.exe"))) {
      $gitOk = $true
    }
  }
  $ErrorActionPreference = $prev

  if ($gitOk) {
    return @{ ok = $true; path = $WorkDir; method = "git"; branch = $Branch }
  }

  Write-Host "Git no disponible o fallo el clone; descargando ZIP del canal (puede ser >1GB)..." -ForegroundColor Yellow
  $zipUrl = Get-DrewRestBranchZipUrl -Branch $Branch
  $zipPath = Join-Path $WorkDir "package.zip"
  try {
    # Timeout alto: el paquete on-prem incluye vendor + api node_modules.
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -TimeoutSec 7200 -UseBasicParsing
    Write-Host "Extrayendo ZIP..." -ForegroundColor Cyan
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
    return @{
      ok = $false
      path = $WorkDir
      method = "zip"
      error = "Fallo la descarga del paquete: $($_.Exception.Message). ¿Hay Git instalado y red a github.com?"
    }
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
