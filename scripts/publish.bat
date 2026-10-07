@echo off
rem ================================================================
rem  SPARK2027 Publish : Downloads -> input -> data.json -> GitHub
rem  Usage: publish.bat or publish.bat /auto
rem  Success: no pause. Errors: pause and exit with code 1.
rem ================================================================
setlocal
cd /d "%~dp0.."

rem ---- settings ----
set "SRC=D:\560258\Downloads\Spark2027.xlsx"
set "DEST=input\Spark2027.xlsx"
set "LOG=input\publish_log.txt"
if not exist "input" mkdir "input"

echo [0/2] Move Excel from Downloads -^> input\
if exist "%SRC%" (
  move /Y "%SRC%" "%DEST%" >nul
  if errorlevel 1 (
    echo *** Cannot move "%SRC%" - close the file in Excel and try again.
    >>"%LOG%" echo %date% %time% ^| FAIL ^| move
    pause
    exit /b 1
  )
  echo     moved: %SRC%  -^>  %DEST%
) else (
  echo     ! %SRC% not found - using existing %DEST%
)

if not exist "%DEST%" (
  echo *** No Excel file at %DEST%
  >>"%LOG%" echo %date% %time% ^| FAIL ^| no excel
  pause
  exit /b 1
)

echo.
echo [1/2] Convert Planner Excel -^> data\data.json
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\convert.ps1" "%DEST%"
if errorlevel 1 (
  echo *** Convert failed
  >>"%LOG%" echo %date% %time% ^| FAIL ^| convert
  pause
  exit /b 1
)

echo.
echo [2/2] Upload to GitHub
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\push.ps1"
if errorlevel 1 (
  echo *** Upload failed
  >>"%LOG%" echo %date% %time% ^| FAIL ^| upload
  pause
  exit /b 1
)

echo.
echo Done.
exit /b 0
