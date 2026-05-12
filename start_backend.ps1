# Start Backend
Write-Host "=====================================" -ForegroundColor Green
Write-Host "   WASTE BUDDY - Starting Backend    " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Login Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@wastebuddy.com" -ForegroundColor White
Write-Host "  Password: Admin@123" -ForegroundColor White
Write-Host "  -- OR --" -ForegroundColor Gray
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Frontend: Open frontend/index.html in browser" -ForegroundColor Cyan
Write-Host "  (Or run: python -m http.server 3000 in frontend folder)" -ForegroundColor Gray
Write-Host ""

Set-Location -Path "$PSScriptRoot\backend"
python app.py
