@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "ROOT=%~dp0.."
cd /d "%ROOT%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\actualizar-drewrest.ps1" %*
if errorlevel 1 pause