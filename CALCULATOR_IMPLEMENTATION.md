# Реализация калькулятора стоимости

## Обзор

Реализована полная функциональность отправки данных с калькулятора стоимости, аналогичная Supabase Edge Function версии.

## Что было реализовано

### 1. Валидация данных (Joi Schema)
- ✅ Полная валидация всех полей калькулятора
- ✅ Имя: минимум 2 символа, максимум 100
- ✅ Телефон: обязательное поле с валидацией формата
- ✅ Email: опциональное поле с валидацией формата
- ✅ Все поля калькулятора: siteType, design, content, seo, urgency, support
- ✅ Числовые поля: calculatedPrice, minPrice, maxPrice
- ✅ Массив features с дефолтным значением []
- ✅ Boolean поле ads с дефолтным значением false

### 2. Сохранение в базу данных
- ✅ Сохранение в таблицу `calculator_forms`
- ✅ Fallback логика: если `calculator_forms` недоступна, сохраняется в `contact_forms`
- ✅ Все поля корректно маппятся в БД
- ✅ JSON массив features сохраняется как JSONB

### 3. Уведомления в Telegram
- ✅ Детальное форматирование сообщения
- ✅ Маппинг значений (тип сайта, дизайн, контент, SEO, срочность, поддержка)
- ✅ Форматирование цен с разделителями тысяч (toLocaleString)
- ✅ HTML форматирование с экранированием
- ✅ Логирование успешных отправок и ошибок

### 4. Интеграция с Bitrix24
- ✅ Создание лида из данных калькулятора
- ✅ Детальное форматирование комментариев
- ✅ Обновление статуса формы после создания лида

### 5. Email подтверждение
- ✅ Отправка подтверждающего email клиенту (если email указан)
- ✅ Поддержка типа формы 'calculator'

## API Endpoint

**POST** `/api/calculator-form`

### Request Body
```json
{
  "name": "Иван Иванов",
  "phone": "+79991234567",
  "email": "ivan@example.com", // опционально
  "siteType": "landing",
  "pages": "1",
  "design": "ready",
  "features": ["catalog", "cart"],
  "content": "ready",
  "seo": "basic",
  "ads": false,
  "urgency": "standard",
  "support": "1month",
  "calculatedPrice": 50000,
  "minPrice": 40000,
  "maxPrice": 60000,
  "timeline": "2-3 недели",
  "formStartedAt": 1234567890 // для антибота
}
```

### Response
```json
{
  "success": true,
  "message": "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.",
  "clientId": "uuid-заявки"
}
```

## Тестирование

Для тестирования используйте скрипт:
```powershell
cd backend
pwsh -File test-calculator.ps1
```

## Отличия от Supabase версии

1. **Валидация**: Используется Joi вместо ручной валидации
2. **Обработка ошибок**: Более детальное логирование ошибок
3. **Fallback**: Сохранение в `contact_forms` если `calculator_forms` недоступна
4. **Уведомления**: Асинхронная отправка с детальным логированием результатов

## Файлы

- `backend/src/routes/calculator.routes.ts` - роут обработки формы
- `backend/src/middleware/validation.ts` - схема валидации `calculatorFormSchema`
- `backend/src/services/databaseService.ts` - метод `saveCalculatorForm` с fallback
- `backend/src/services/telegramService.ts` - метод `sendCalculatorFormNotification`
- `backend/src/services/bitrixService.ts` - метод `createCalculatorFormLead`
- `backend/test-calculator.ps1` - тестовый скрипт










