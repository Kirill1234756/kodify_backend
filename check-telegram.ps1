# Скрипт для проверки настроек Telegram

Write-Host "Проверка настроек Telegram..." -ForegroundColor Yellow
Write-Host ""

# Проверка через API
try {
    $test = Invoke-RestMethod -Uri "http://localhost:3000/api/test/telegram" -Method GET
    Write-Host "API Test Result:" -ForegroundColor Cyan
    $test | ConvertTo-Json
    Write-Host ""
    
    if ($test.success -eq $true) {
        Write-Host "✅ Telegram бот работает!" -ForegroundColor Green
    } else {
        Write-Host "❌ Telegram бот не работает" -ForegroundColor Red
        Write-Host ""
        Write-Host "Возможные причины:" -ForegroundColor Yellow
        Write-Host "1. Неправильный TELEGRAM_BOT_TOKEN в .env" -ForegroundColor Gray
        Write-Host "2. Неправильный TELEGRAM_CHAT_ID в .env" -ForegroundColor Gray
        Write-Host "3. Бот не добавлен в группу/канал" -ForegroundColor Gray
        Write-Host "4. Бот не имеет прав на отправку сообщений" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Ошибка при проверке:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "Проверьте логи сервера для деталей ошибки" -ForegroundColor Yellow










