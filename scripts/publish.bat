@echo off
cd /d "%~dp0.."
echo [1/3] Convert Planner Excel -^> data\data.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\convert.ps1 || (echo *** Convert failed & pause & exit /b 1)
where git >nul 2>nul || (echo.& echo git not found - data\data.json is ready. Commit/push with GitHub Desktop. & pause & exit /b 0)
echo [2/3] Commit
git add data/data.json data/config.json
git diff --cached --quiet && (echo No data changes. & pause & exit /b 0)
git commit -m "data: update %date% %time%"
echo [3/3] Push
git push || (echo *** Push failed & pause & exit /b 1)
echo Published.
pause
