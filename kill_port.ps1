# Kill processes on port 8000
$ports = @(1708, 25228, 32400)
foreach ($p in $ports) {
    $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Killing process $p : $($proc.ProcessName)"
        Stop-Process -Id $p -Force
    }
}
Write-Host "Done"
