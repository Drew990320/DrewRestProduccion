# Cierra procesos node de DrewRest (API Nest, spa-server web) si siguen activos.
# No toca Expo/Metro (puerto 8081 u otros servicios de desarrollo).
$procs = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" -ErrorAction SilentlyContinue
foreach ($p in $procs) {
  $cl = $p.CommandLine
  if ($null -eq $cl) { continue }
  if ($cl -match 'run-forever\.js') {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    continue
  }
  if ($cl -match 'dist[\\/]main\.js' -or $cl -match 'dist[\\/]src[\\/]main\.js') {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    continue
  }
  if ($cl -match 'spa-server\.js') {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
  }
}
