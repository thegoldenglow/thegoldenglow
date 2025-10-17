# Start development servers for The Golden Glow
Write-Host "Starting The Golden Glow development environment..." -ForegroundColor Green

# Start Vite dev server in background
Write-Host "Starting Vite dev server..." -ForegroundColor Cyan
$viteJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev:frontend
}

# Wait a moment for Vite to initialize
Start-Sleep -Seconds 2

# Start Telegram bot in background
Write-Host "Starting Telegram bot..." -ForegroundColor Cyan
$botJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run bot:launch
}

Write-Host "`nBoth services started!" -ForegroundColor Green
Write-Host "- Vite dev server: http://localhost:3000" -ForegroundColor Yellow
Write-Host "- Telegram bot: Running in background" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor Gray

# Monitor jobs and show output
try {
    while ($true) {
        # Get output from jobs
        $viteOutput = Receive-Job -Job $viteJob -Keep
        $botOutput = Receive-Job -Job $botJob -Keep
        
        if ($viteOutput) {
            Write-Host "[VITE] $viteOutput" -ForegroundColor Blue
        }
        if ($botOutput) {
            Write-Host "[BOT] $botOutput" -ForegroundColor Magenta
        }
        
        # Check if jobs are still running
        if ($viteJob.State -ne 'Running' -and $botJob.State -ne 'Running') {
            Write-Host "All jobs completed or stopped" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Milliseconds 500
    }
}
finally {
    # Cleanup on exit
    Write-Host "`nStopping all services..." -ForegroundColor Yellow
    Stop-Job -Job $viteJob, $botJob
    Remove-Job -Job $viteJob, $botJob
    Write-Host "All services stopped." -ForegroundColor Green
}
