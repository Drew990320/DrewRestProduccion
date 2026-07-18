@echo off
setlocal
cd /d "%~dp0"

if not exist "%~dp0DrewRest-Setup.exe" (
  echo No se encuentra DrewRest-Setup.exe en esta carpeta.
  echo Descarga el Release de GitHub ^(archivo de unos 50 MB^).
  pause
  exit /b 1
)

REM Quitar bloqueo de Windows (Zone.Identifier) al copiar desde USB/internet.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Unblock-File -LiteralPath '%~dp0DrewRest-Setup.exe' -ErrorAction SilentlyContinue"

echo Abriendo DrewRest-Setup...
start "" "%~dp0DrewRest-Setup.exe"
exit /b 0
