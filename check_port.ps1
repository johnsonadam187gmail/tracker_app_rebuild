# Check what processes are on port 8000
$connections = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
foreach ($c in $connections) {
    $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "PID: $($c.OwningProcess)"
    if ($proc) {
        Write-Host "  Name: $($proc.ProcessName)"
        Write-Host "  Path: $($proc.Path)"
    }
}
