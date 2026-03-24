# Kill process on port 3000
$proc = Get-Process -Id 14660 -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Killing PID 14660"
    Stop-Process -Id 14660 -Force
    Write-Host "Killed"
} else {
    Write-Host "Process not found"
}
