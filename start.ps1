# FastFood Platform — Start Guide
Write-Host "🚀 Starting FastFood Platform..." -ForegroundColor Green

# Start API
Write-Host "Starting API on port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\api'; npm run dev" -WindowStyle Normal
Start-Sleep 3

# Start CustomerApp
Write-Host "Starting CustomerApp on port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\customer'; npx vite --force" -WindowStyle Normal

# Start RiderApp
Write-Host "Starting RiderApp on port 5174..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\rider'; npx vite --port 5174 --force" -WindowStyle Normal

# Start Admin Dashboard
Write-Host "Starting Admin Dashboard on port 5175..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\admin'; npx vite --port 5175 --force" -WindowStyle Normal
  
  
Start-Sleep 5
Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host "📱 CustomerApp:      http://localhost:5173" -ForegroundColor Yellow
Write-Host "🏍️  RiderApp:         http://localhost:5174" -ForegroundColor Yellow
Write-Host "🖥️  Admin Dashboard:  http://localhost:5175" -ForegroundColor Yellow
Write-Host "⚙️  API:              http://localhost:5000/v1" -ForegroundColor Yellow
Write-Host "🏥 Health:           http://localhost:5000/v1/health" -ForegroundColor Yellow

