# ==============================================================================
# Azure Bug Assistant - Windows Task Scheduler Setup Script (Node.js)
# ==============================================================================
# Registers an automated background sync task that runs every 15 minutes.
# Works even when your browser or IDE is closed!

param(
    [ValidateSet("register", "unregister", "run-now", "status")]
    [string]$Action = "status",
    [int]$IntervalMinutes = 15
)

$TaskName = "AzureBugAssistant_AutoSync"
$WorkspaceRoot = $PSScriptRoot
$NodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
$ScriptPath = Join-Path $WorkspaceRoot "backend\dist\jobs\sync-task.js"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Azure Bug Assistant — Windows Task Scheduler Management  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not $NodeExe) {
    Write-Host "[ERROR] Node.js was not found in PATH." -ForegroundColor Red
    exit 1
}

if ($Action -eq "unregister") {
    Write-Host "Removing Scheduled Task '$TaskName'..." -ForegroundColor Yellow
    schtasks.exe /Delete /TN $TaskName /F
    Write-Host "Task '$TaskName' successfully removed." -ForegroundColor Green
    exit 0
}

if ($Action -eq "status") {
    Write-Host "Querying task '$TaskName'..." -ForegroundColor Gray
    schtasks.exe /Query /TN $TaskName /FO LIST
    exit 0
}

if ($Action -eq "run-now") {
    Write-Host "Starting Scheduled Task '$TaskName' immediately..." -ForegroundColor Cyan
    schtasks.exe /Run /TN $TaskName
    Write-Host "Task triggered! Check sync status in the web dashboard or database." -ForegroundColor Green
    exit 0
}

# Default: Register Scheduled Task
Write-Host "Target Script : $ScriptPath" -ForegroundColor Gray
Write-Host "Node Path     : $NodeExe" -ForegroundColor Gray
Write-Host "Sync Interval : Every $IntervalMinutes minutes" -ForegroundColor Gray

$TaskCmd = "`"$NodeExe`" `"$ScriptPath`""
schtasks.exe /Create /SC MINUTE /MO $IntervalMinutes /TN $TaskName /TR $TaskCmd /F

Write-Host "`nScheduled Task '$TaskName' successfully registered!" -ForegroundColor Green
Write-Host "• It will run automatically every $IntervalMinutes minutes in the background." -ForegroundColor Green
Write-Host "• No web browser or dashboard needs to be open." -ForegroundColor Cyan
Write-Host "`nUseful commands:" -ForegroundColor Gray
Write-Host "  powershell -File .\setup_scheduler.ps1 -Action status   # Check status and next run"
Write-Host "  powershell -File .\setup_scheduler.ps1 -Action run-now  # Trigger sync immediately"
Write-Host "  powershell -File .\setup_scheduler.ps1 -Action unregister # Remove scheduled task`n"
