# PowerShell script to run Azure Bug Assistant Frontend
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Azure Bug Assistant Frontend (Vite + React TS)   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Navigate to frontend folder
Set-Location $PSScriptRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js / npm is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

Write-Host "Web Dashboard will run on: http://localhost:5173 (and http://127.0.0.1:5173)" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the frontend server.`n" -ForegroundColor Gray

npx vite --host 0.0.0.0 --port 5173
