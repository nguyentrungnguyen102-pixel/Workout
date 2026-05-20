@echo off
echo === Workout Tracker: Setup + Start ===
echo.
cd /d %~dp0

echo [1/4] Pulling latest code...
git pull
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: git pull failed. Kiem tra ket noi mang.
  pause
  exit /b 1
)

echo.
echo [2/4] Installing packages (clean install from lock file)...
npm ci
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: npm ci failed. Thu chay: npm install
  pause
  exit /b 1
)

echo.
echo [3/4] Checking package versions...
node check-versions.js
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: Version mismatch! Chay lai: npm ci
  pause
  exit /b 1
)

echo.
echo [4/4] Starting Expo (clearing cache)...
npx expo start --clear
