@echo off
rem Atajo opcional: abre el launcher embebido.
if exist "%~dp0DrewRest.exe" (
  start "" "%~dp0DrewRest.exe" %*
  exit /b 0
)
echo Falta DrewRest.exe en esta carpeta.
echo Vuelve a empaquetar el paquete DrewRest o copia el ejecutable.
exit /b 1
