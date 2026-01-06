# PowerShell script to run backend with logging
Set-Location $PSScriptRoot
Write-Host "Starting backend with debug logging..." -ForegroundColor Green
Write-Host "Logs will be saved to: $PSScriptRoot\debug.log" -ForegroundColor Yellow
Write-Host ""

# Run npm and tee output to both console and file
npm run dev 2>&1 | Tee-Object -FilePath "debug.log"
