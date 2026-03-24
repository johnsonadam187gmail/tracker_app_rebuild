# Kill all Python processes related to our app
$processIds = @(1708, 25228, 32400)
foreach ($p in $processIds) {
    try {
        Stop-Process -Id $p -Force -ErrorAction Stop
        Write-Host "Killed PID $p"
    } catch {
        Write-Host "Could not kill PID $p : $_"
    }
}

# Also kill any remaining python processes that might be holding the port
$pyProcs = Get-Process python* -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*rebuild*" -or $_.Path -like "*backend*" -or $_.Path -like "*uvicorn*" }
foreach ($py in $pyProcs) {
    try {
        Stop-Process -Id $py.Id -Force -ErrorAction Stop
        Write-Host "Killed Python process PID $($py.Id)"
    } catch {
        Write-Host "Could not kill PID $($py.Id) : $_"
    }
}

Write-Host "Done checking processes"
