# Test client form submission
$startTime = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
Start-Sleep -Seconds 4

# Create a test file
$testFile = Join-Path $env:TEMP "test-client-form.txt"
"Test file content for client form" | Out-File -FilePath $testFile -Encoding UTF8

$boundary = [System.Guid]::NewGuid().ToString()
$fileBytes = [System.IO.File]::ReadAllBytes($testFile)
$fileName = "test-client-form.txt"

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"companyDescription`"",
    "",
    "Мы - IT-компания, специализирующаяся на разработке веб-приложений и мобильных приложений. Работаем с клиентами из различных отраслей.",
    "--$boundary",
    "Content-Disposition: form-data; name=`"task`"",
    "",
    "Нужно разработать современный веб-сайт для нашей компании с интеграцией CRM системы и онлайн-каталогом продукции.",
    "--$boundary",
    "Content-Disposition: form-data; name=`"solutionVision`"",
    "",
    "Хотим получить современный, быстрый и удобный сайт с адаптивным дизайном, который будет работать на всех устройствах.",
    "--$boundary",
    "Content-Disposition: form-data; name=`"expectations`"",
    "",
    "Ожидаем профессиональную разработку, своевременную сдачу проекта и техническую поддержку после запуска.",
    "--$boundary",
    "Content-Disposition: form-data; name=`"budget`"",
    "",
    "500000 - 1000000 руб",
    "--$boundary",
    "Content-Disposition: form-data; name=`"name`"",
    "",
    "Иван Иванов",
    "--$boundary",
    "Content-Disposition: form-data; name=`"company`"",
    "",
    "ООО Тестовая Компания",
    "--$boundary",
    "Content-Disposition: form-data; name=`"phone`"",
    "",
    "+79991234567",
    "--$boundary",
    "Content-Disposition: form-data; name=`"email`"",
    "",
    "ivan@example.com",
    "--$boundary",
    "Content-Disposition: form-data; name=`"privacyAccepted`"",
    "",
    "true",
    "--$boundary",
    "Content-Disposition: form-data; name=`"formStartedAt`"",
    "",
    $startTime,
    "--$boundary",
    "Content-Disposition: form-data; name=`"attachedFile`"; filename=`"$fileName`"",
    "Content-Type: text/plain",
    "",
    [System.Text.Encoding]::UTF8.GetString($fileBytes),
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

Write-Host "Sending client form request with file..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/client-form" -Method POST -Body $bodyBytes -ContentType "multipart/form-data; boundary=$boundary"
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
} finally {
    # Clean up test file
    if (Test-Path $testFile) {
        Remove-Item $testFile -Force
    }
}









