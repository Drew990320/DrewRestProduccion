@echo off
chcp 65001 >nul
setlocal EnableExtensions

echo ========================================
echo   DrewRest - Evitar suspension del PC
echo ========================================
echo.
echo Este PC hace de servidor. Si Windows entra en suspension, la app deja de funcionar.
echo.
echo Configurando (solo con corriente / enchufado):
echo   - Sin suspension automatica
echo   - Sin hibernacion automatica
echo   - Monitor puede apagarse a los 30 min
echo.

powercfg /change standby-timeout-ac 0
if errorlevel 1 goto :err
powercfg /change hibernate-timeout-ac 0
if errorlevel 1 goto :err
powercfg /change monitor-timeout-ac 30
if errorlevel 1 goto :err

echo Listo.
echo.
echo Recomendaciones:
echo   - Deja DrewRest.exe en marcha (o minimizado).
echo   - No cierres sesion en Windows; bloquear pantalla esta bien.
echo   - Para detener el sistema usa DrewRest.exe o detener.bat.
echo.
pause
exit /b 0

:err
echo.
echo [ERROR] No se pudo cambiar la configuracion de energia.
echo         Ejecuta como administrador o cambialo manualmente en Panel de control.
echo.
pause
exit /b 1
