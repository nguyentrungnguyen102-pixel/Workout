# Workout Tracker — Windows PowerShell startup
# Chay: .\start.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Workout Tracker Dev Setup (Windows)  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js
try {
    $nodeVer = node -v
    Write-Host "OK Node.js $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "Node.js chua cai. Tai tai: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Install npm packages
if (-not (Test-Path "node_modules")) {
    Write-Host "Cai npm packages..." -ForegroundColor Cyan
    npm install --legacy-peer-deps
}
Write-Host "OK node_modules" -ForegroundColor Green

# 3. Install Firebase CLI
$firebaseExists = $null
try { $firebaseExists = Get-Command firebase -ErrorAction SilentlyContinue } catch {}
if (-not $firebaseExists) {
    Write-Host "Cai Firebase CLI..." -ForegroundColor Cyan
    npm install -g firebase-tools
}
Write-Host "OK Firebase CLI" -ForegroundColor Green

# 4. Check Java (Firebase Emulator)
$javaExists = $null
try { $javaExists = Get-Command java -ErrorAction SilentlyContinue } catch {}

if ($javaExists) {
    Write-Host ""
    Write-Host "Khoi dong Firebase Emulator..." -ForegroundColor Cyan
    $emulatorJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        firebase emulators:start --project demo-workout --only auth,firestore `
            --import ./emulator-data --export-on-exit ./emulator-data 2>&1
    }
    Write-Host "Firebase Emulator dang chay (Job ID: $($emulatorJob.Id))" -ForegroundColor Green
    Write-Host "   Emulator UI: http://localhost:4000" -ForegroundColor Green
    Start-Sleep -Seconds 5
} else {
    Write-Host "Java chua cai — bo qua Firebase Emulator" -ForegroundColor Yellow
    Write-Host "   Cai Java: https://adoptium.net (LTS)" -ForegroundColor Yellow
}

# 5. Start Expo
Write-Host ""
Write-Host "Khoi dong Expo..." -ForegroundColor Cyan
Write-Host "   -> Scan QR bang Expo Go tren dien thoai" -ForegroundColor Yellow
Write-Host "   -> Dien thoai va may tinh phai cung WiFi" -ForegroundColor Yellow
Write-Host ""

npx expo start
