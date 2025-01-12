@echo off

set SourceDir=%~dp0
set TempDir=%Temp%\Relay

if exist "%TempDir%" rd /s /q "%TempDir%"
git clone https://github.com/kayyraa/Relay.git "%TempDir%"
cd /d "%TempDir%"
del /q *.*
for /d %%x in (*) do rd /s /q "%%x"
git add .
git commit -m "Cleared all files"
git push origin main --force
cd ..
rd /s /q "%TempDir%"

if exist "%TempDir%" rd /s /q "%TempDir%"
git clone https://github.com/kayyraa/Relay.git "%TempDir%"

xcopy /s /e /y "%SourceDir%\*" "%TempDir%"
cd "%TempDir%"
git add .
git commit -m "Auto-update from local project folder"
git push origin main --force

cd ..
timeout /t 5 /nobreak >nul
rd /s /q "%TempDir%"