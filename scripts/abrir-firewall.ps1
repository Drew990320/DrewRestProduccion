# Reglas entrantes TCP para DrewRest (ejecutar como administrador).
# Web: rango 8080-8104 porque spa-server usa el siguiente puerto libre si 8080 está ocupado (p. ej. 8082).
$ErrorActionPreference = 'Stop'
$rules = @(
  @{ Name = 'DrewRest API (3000)'; Port = '3000' },
  @{ Name = 'DrewRest Web LAN (8080-8104)'; Port = '8080-8104' }
)
foreach ($r in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Enable-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue | Out-Null
    Write-Host "Ya existe: $($r.Name)" -ForegroundColor DarkGray
    continue
  }
  New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $r.Port -Profile Any | Out-Null
  Write-Host "Creada regla: $($r.Name)" -ForegroundColor Green
}
Write-Host ""
Write-Host "Listo. Prueba desde el celular (misma Wi-Fi): http://IP_DEL_PC:8080  (o el puerto de web-port.txt)" -ForegroundColor Green
Read-Host "Enter para cerrar"
