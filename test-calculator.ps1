# Test calculator form submission
$startTime = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
Start-Sleep -Seconds 4

$body = @{
    name = "Test Calculator User"
    phone = "+79991234567"
    email = "calculator@example.com"
    siteType = "landing"
    pages = "1"
    design = "ready"
    features = @("catalog", "cart", "payment")
    content = "ready"
    seo = "basic"
    ads = $false
    urgency = "standard"
    support = "1month"
    calculatedPrice = 50000
    minPrice = 40000
    maxPrice = 60000
    timeline = "2-3 недели"
    formStartedAt = $startTime
} | ConvertTo-Json

Write-Host "Sending calculator form request..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/calculator-form" -Method POST -Body $body -ContentType "application/json"
    Write-Host "`nSUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json
    Write-Host "`nCheck Telegram - notification should arrive!" -ForegroundColor Yellow
    Write-Host "Request ID: $($response.clientId)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message
    }
}










