# Скрипт для тестирования отправки данных в Telegram
# Убедитесь, что сервер запущен: npm run dev

Write-Host "Отправка тестовой заявки..." -ForegroundColor Yellow

$body = @{
    name = "Тестовый Пользователь"
    phone = "+79991234567"
    email = "test@example.com"
    formStartedAt = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
} | ConvertTo-Json -Compress

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/contact-form" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ Успешно!" -ForegroundColor Green
    Write-Host "Ответ сервера:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    Write-Host "`nПроверьте Telegram - должно прийти уведомление!" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Ошибка:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Детали ошибки:" -ForegroundColor Red
        Write-Host $responseBody
    }
}










