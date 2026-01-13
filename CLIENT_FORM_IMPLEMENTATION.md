# Реализация формы "Стать клиентом"

## Обзор

Реализована полная функциональность отправки данных с формы "Стать клиентом", аналогичная Supabase Edge Function версии.

## Что было реализовано

### 1. Валидация данных (Joi Schema)
- ✅ Полная валидация всех полей формы клиента
- ✅ Описание компании: минимум 10 символов, максимум 2000
- ✅ Задача: минимум 10 символов, максимум 1000
- ✅ Видение решения: минимум 10 символов, максимум 1000
- ✅ Ожидания: минимум 10 символов, максимум 1000
- ✅ Бюджет: минимум 3 символа, максимум 100
- ✅ Имя: минимум 2 символа, максимум 100
- ✅ Компания: минимум 2 символа, максимум 200
- ✅ Телефон: обязательное поле с валидацией формата
- ✅ Email: обязательное поле с валидацией формата
- ✅ Политика конфиденциальности: обязательное подтверждение
- ✅ Валидация загружаемого файла (размер, тип)

### 2. Загрузка файлов
- ✅ Загрузка файлов через Multer middleware
- ✅ Валидация размера файла (максимум 20MB)
- ✅ Валидация типа файла (PDF, DOC, DOCX, TXT, JPG, JPEG, PNG)
- ✅ Сохранение файлов в локальное хранилище
- ✅ Генерация публичных URL для файлов

### 3. Сохранение в базу данных
- ✅ Сохранение в таблицу `client_forms`
- ✅ Все поля корректно маппятся в БД
- ✅ Сохранение информации о файле (URL, имя, размер)
- ✅ Транзакционная обработка (BEGIN/COMMIT)

### 4. Уведомления в Telegram
- ✅ Детальное форматирование сообщения со всеми полями
- ✅ Включение описания компании, задачи, видения решения, ожиданий
- ✅ Информация о прикрепленном файле (если есть)
- ✅ HTML форматирование с экранированием
- ✅ Логирование успешных отправок и ошибок

### 5. Интеграция с Bitrix24
- ✅ Создание лида из данных формы клиента
- ✅ Детальное форматирование комментариев со всеми полями
- ✅ Информация о прикрепленном файле в комментариях
- ✅ Обновление статуса формы после создания лида

### 6. Email уведомления
- ✅ Отправка уведомления администратору
- ✅ Отправка подтверждающего email клиенту
- ✅ HTML форматирование писем

## API Endpoint

**POST** `/api/client-form`

### Request (multipart/form-data)
```
companyDescription: string (min 10, max 2000)
task: string (min 10, max 1000)
solutionVision: string (min 10, max 1000)
expectations: string (min 10, max 1000)
budget: string (min 3, max 100)
name: string (min 2, max 100)
company: string (min 2, max 200)
phone: string (required, validated format)
email: string (required, validated format)
privacyAccepted: boolean (must be true)
attachedFile: File (optional, max 20MB, allowed types: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG)
formStartedAt: number (for antibot)
```

### Response
```json
{
  "success": true,
  "message": "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.",
  "clientId": "uuid-заявки"
}
```

## Дополнительные Endpoints

### GET `/api/client-form/:id`
Получить заявку по ID (для администратора)

### GET `/api/client-form`
Получить все заявки с пагинацией (для администратора)
- Query params: `page`, `limit`, `status`

### PUT `/api/client-form/:id/status`
Обновить статус заявки (для администратора)
- Body: `{ "status": "in_progress", "bitrixLeadId": 123 }`

## Тестирование

Для тестирования используйте скрипт:
```powershell
cd backend
pwsh -File test-client-form.ps1
```

## Отличия от Supabase версии

1. **Загрузка файлов**: 
   - Supabase: файл загружается на фронтенде через signed URL, в бекенд приходит только URL
   - Node.js: файл загружается на бекенде через Multer middleware

2. **Валидация**: 
   - Supabase: простая валидация длин полей
   - Node.js: полная валидация через Joi схему с детальными сообщениями об ошибках

3. **Обработка ошибок**: 
   - Более детальное логирование ошибок
   - Улучшенная обработка результатов уведомлений

4. **Telegram сообщения**: 
   - Более детальное форматирование с включением всех полей
   - Информация о прикрепленном файле

## Файлы

- `backend/src/routes/clientForm.routes.ts` - роут обработки формы
- `backend/src/middleware/validation.ts` - схема валидации `clientFormSchema`
- `backend/src/middleware/fileUpload.ts` - обработка загрузки файлов
- `backend/src/services/databaseService.ts` - метод `saveClientForm`
- `backend/src/services/telegramService.ts` - метод `sendClientFormNotification`
- `backend/src/services/bitrixService.ts` - метод `createClientFormLead` и `formatClientFormComments`
- `backend/src/services/emailService.ts` - методы отправки email
- `backend/src/services/fileStorageService.ts` - обработка файлового хранилища
- `backend/test-client-form.ps1` - тестовый скрипт









