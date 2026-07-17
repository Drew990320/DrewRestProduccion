@echo off
if exist "%~dp0DrewRest.exe" (
  start "" "%~dp0DrewRest.exe" stop
  exit /b 0
)
echo Falta DrewRest.exe en esta carpeta.
exit /b 1
