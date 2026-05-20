@echo off
echo === Workout Tracker: Setup + Start ===
cd /d %~dp0
echo.
echo [1/3] Getting latest code...
git fetch --all
git reset --hard origin/claude/workout-tracker-app-VlOYg
if %ERRORLEVEL% NEQ 0 (echo ERROR: git failed & pause & exit /b 1)
echo.
echo [2/3] Installing packages...
call npm ci --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (echo ERROR: npm ci failed & pause & exit /b 1)
echo.
echo [3/3] Starting Expo...
call npx expo start --clear
