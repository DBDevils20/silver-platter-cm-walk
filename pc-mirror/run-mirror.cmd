@echo off
rem Runs the Egnyte mirror once. Scheduled task calls this every 15 minutes.
set PATH=C:\Program Files\nodejs;%PATH%
node "%~dp0mirror.cjs"
