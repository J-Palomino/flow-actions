# Quick shutdown script for Flow Actions Scaffold project

Write-Host "🔄 Shutting down Flow Actions Scaffold services..." -ForegroundColor Yellow

# Stop Flow emulator if running
$flowProcesses = Get-Process | Where-Object { $_.ProcessName -like "*flow*" -or $_.CommandLine -like "*emulator*" } -ErrorAction SilentlyContinue
if ($flowProcesses) {
    Write-Host "🛑 Stopping Flow emulator..." -ForegroundColor Yellow
    $flowProcesses | Stop-Process -Force
    Write-Host "✅ Flow emulator stopped" -ForegroundColor Green
}

# Stop frontend dev server (Next.js)
$frontendPath = ".\frontend-integration"
if (Test-Path $frontendPath) {
    Push-Location $frontendPath
    try {
        # Kill any npm/node processes that might be running the dev server
        $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
        if ($nodeProcesses) {
            Write-Host "🛑 Stopping Next.js dev server..." -ForegroundColor Yellow
            $nodeProcesses | Stop-Process -Force
            Write-Host "✅ Next.js dev server stopped" -ForegroundColor Green
        }
    }
    finally {
        Pop-Location
    }
}

# Stop any background bash processes we might have started
$bashProcesses = Get-Process bash -ErrorAction SilentlyContinue
if ($bashProcesses) {
    Write-Host "🛑 Stopping bash processes..." -ForegroundColor Yellow
    $bashProcesses | Stop-Process -Force
    Write-Host "✅ Bash processes stopped" -ForegroundColor Green
}

Write-Host "✅ Flow Actions Scaffold shutdown complete!" -ForegroundColor Green