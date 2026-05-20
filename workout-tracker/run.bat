@echo off
echo === Workout Tracker: Setup + Start ===
cd /d %~dp0
echo.
echo [1/4] Getting latest code...
git fetch --all
git reset --hard origin/claude/workout-tracker-app-VlOYg
if %ERRORLEVEL% NEQ 0 (echo ERROR: git failed & pause & exit /b 1)
echo.
echo [2/4] Clearing old node_modules...
if exist node_modules rmdir /s /q node_modules
echo.
echo [3/4] Installing packages (this takes ~2 min first time)...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (echo ERROR: npm install failed & pause & exit /b 1)
echo.
echo [4/4] Starting Expo...
call npx expo start --clear
