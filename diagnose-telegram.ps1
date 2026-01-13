# Диагностика Telegram бота

Write-Host "=== Диагностика Telegram бота ===" -ForegroundColor Cyan
Write-Host ""

# 1. Проверка переменных окружения
Write-Host "1. Проверка переменных окружения:" -ForegroundColor Yellow
$envFile = Get-Content "backend\.env" -Raw
if ($envFile -match "TELEGRAM_BOT_TOKEN=([^\r\n]+)") {
    $token = $matches[1]
    if ($token -match "^[\d]+:") {
        Write-Host "   ✅ TELEGRAM_BOT_TOKEN найден (формат правильный)" -ForegroundColor Green
        Write-Host "   Токен начинается с: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ TELEGRAM_BOT_TOKEN имеет неправильный формат" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ TELEGRAM_BOT_TOKEN не найден в .env" -ForegroundColor Red
}

if ($envFile -match "TELEGRAM_CHAT_ID=([^\r\n]+)") {
    $chatId = $matches[1]
    if ($chatId -match "^-?\d+$") {
        Write-Host "   ✅ TELEGRAM_CHAT_ID найден: $chatId" -ForegroundColor Green
    } else {
        Write-Host "   ❌ TELEGRAM_CHAT_ID имеет неправильный формат: $chatId" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ TELEGRAM_CHAT_ID не найден в .env" -ForegroundColor Red
}

Write-Host ""

# 2. Проверка через API
Write-Host "2. Проверка через API:" -ForegroundColor Yellow
try {
    $test = Invoke-RestMethod -Uri "http://localhost:3000/api/test/telegram" -Method GET
    if ($test.success) {
        Write-Host "   ✅ Telegram бот работает!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Telegram бот не работает" -ForegroundColor Red
        Write-Host "   Сообщение: $($test.message)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Ошибка при проверке API" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Рекомендации ===" -ForegroundColor Cyan
Write-Host "1. Убедитесь, что бот добавлен в канал/группу" -ForegroundColor Yellow
Write-Host "2. Проверьте, что у бота есть права на отправку сообщений" -ForegroundColor Yellow
Write-Host "3. Для канала: бот должен быть администратором с правом 'Управление сообщениями каналу'" -ForegroundColor Yellow
Write-Host "4. Проверьте логи сервера для деталей ошибки" -ForegroundColor Yellow
Write-Host ""
Write-Host "Проверьте логи сервера (консоль где запущен npm run dev)" -ForegroundColor Cyan
Write-Host "Ищите строки с 'Error sending Telegram notification' или 'Error details'" -ForegroundColor Gray










