# ==============================================================================
# Azure Bug Assistant - One-Click Launcher for Windows
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Launching Azure Bug Assistant Full-Stack Application      " -ForegroundColor Cyan
Write-Host " Node.js Express Backend & Vite React 19 Frontend          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$WorkspaceRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

# Verify Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 1. Start Backend in a new window
Write-Host "[1/2] Starting Node.js Express Backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$WorkspaceRoot\backend'; & '$WorkspaceRoot\backend\run_backend.ps1'"

# Give backend a moment to spin up
Start-Sleep -Seconds 2

# 2. Start Frontend in a new window
Write-Host "[2/2] Starting React Vite Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$WorkspaceRoot\frontend'; & '$WorkspaceRoot\frontend\run_frontend.ps1'"

Start-Sleep -Seconds 3

# Launch default browser to dashboard
Start-Process "http://localhost:5173"

Write-Host "`nBoth services are active!" -ForegroundColor Green
Write-Host "• Frontend Dashboard : http://localhost:5173" -ForegroundColor Cyan
Write-Host "• Backend API Health : http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host "• Excel Workbook     : $WorkspaceRoot\Development_QA_Accuracy_Tracker_Automated_UPDATED (2).xlsx`n" -ForegroundColor Cyan
