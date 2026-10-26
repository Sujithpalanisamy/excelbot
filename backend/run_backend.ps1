# PowerShell script to run Azure Bug Assistant Backend (Node.js / Express)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Azure Bug Assistant Backend (Node.js + Express) " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Navigate to backend directory
$BackendDir = $PSScriptRoot
Set-Location $BackendDir

# Verify Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

Write-Host "API Server will run on: http://localhost:8000 (and http://127.0.0.1:8000)" -ForegroundColor Green
Write-Host "Health check endpoint: http://localhost:8000/api/health" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the backend server.`n" -ForegroundColor Gray

npm run dev
