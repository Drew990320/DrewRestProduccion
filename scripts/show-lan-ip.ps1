# Muestra la IP LAN de este PC para conectar celulares (DrewRest).
param(
  [int]$WebPort = 8080,
  [int]$ApiPort = 3000,
  [switch]$Compact
)

$ip = $null
Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.IPAddress -notmatch '^127\.' -and
    $_.IPAddress -notmatch '^169\.254\.' -and
    $_.PrefixOrigin -ne 'WellKnown'
  } |
  Sort-Object {
    if ($_.InterfaceAlias -match 'Wi-?Fi|WLAN|Wireless') { 0 }
    elseif ($_.InterfaceAlias -match 'Ethernet|LAN') { 1 }
    else { 2 }
  } |
  ForEach-Object {
    if (-not $ip) { $ip = $_.IPAddress }
  }

if (-not $ip) {
  Write-Host 'No se detectó una IP LAN usable.' -ForegroundColor Red
  exit 1
}

if ($Compact) {
  Write-Output $ip
  exit 0
}

Write-Host ''
Write-Host 'DrewRest — conexión en red local' -ForegroundColor Cyan
Write-Host "  IP:      $ip"
Write-Host "  Web:     http://${ip}:$WebPort"
Write-Host "  API:     http://${ip}:$ApiPort"
Write-Host ''
