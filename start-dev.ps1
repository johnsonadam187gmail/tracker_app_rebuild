$projectRoot = "C:\Users\johns\OneDrive\Desktop\projects\rebuild"

Write-Host "Starting CKB Tracker Development Servers..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting backend on port 8000..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd /d $projectRoot\backend && .venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 2

Write-Host "Starting frontend on port 3000..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd /d $projectRoot\ckb-tracker && npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "CKB Tracker is running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Two command windows should have opened." -ForegroundColor Yellow