@echo off
rem Starts the Silver Platter sync server (and keeps it running).
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"
:loop
node server.cjs
echo Server stopped — restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop
