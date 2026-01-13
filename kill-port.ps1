# Скрипт для освобождения указанного порта
# Использование: .\kill-port.ps1 [PORT]
# Пример: .\kill-port.ps1 3000

param(
    [int]$Port = 3000
)

Write-Host "Checking port $Port..." -ForegroundColor Yellow

$connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
        Write-Host "Stopping process..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force
        Write-Host "Process stopped!" -ForegroundColor Green
        
        # Wait a bit and check again
        Start-Sleep -Milliseconds 500
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if (-not $connection) {
            Write-Host "Port $Port is now free" -ForegroundColor Green
        } else {
            Write-Host "Warning: Port $Port may still be in use" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Port $Port is free" -ForegroundColor Green
}

# Optionally kill all Node.js processes (commented out by default to avoid killing other Node processes)
# Uncomment if you want to kill all Node.js processes
# $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
# if ($nodeProcesses) {
#     Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
#     $nodeProcesses | Stop-Process -Force
#     Write-Host "All Node.js processes stopped" -ForegroundColor Green
# } else {
#     Write-Host "No Node.js processes running" -ForegroundColor Gray
# }

Write-Host "`nYou can now run: npm run dev" -ForegroundColor Cyan




