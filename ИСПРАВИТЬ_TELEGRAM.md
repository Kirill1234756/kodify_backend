# 🔧 Исправление проблемы с Telegram уведомлениями

## Проблема
Форма успешно отправляется, но заявки не приходят в Telegram.

## ✅ Решение

### Шаг 1: Проверить настройки Telegram на VPS

Подключитесь к VPS и проверьте `.env` файл:

```bash
cd ~/projects/kodify/backend
nano .env
```

Убедитесь, что указаны правильные значения:

```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_CHAT_ID=ваш_chat_id
```

**Важно:**
- `TELEGRAM_BOT_TOKEN` - токен вашего бота от @BotFather
- `TELEGRAM_CHAT_ID` - ID чата, куда бот будет отправлять сообщения

### Шаг 2: Как получить TELEGRAM_BOT_TOKEN

1. Откройте Telegram и найдите бота **@BotFather**
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте токен (формат: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Шаг 3: Как получить TELEGRAM_CHAT_ID

#### Вариант 1: Для личного чата с ботом
1. Создайте бота через @BotFather
2. Найдите вашего бота в Telegram
3. Отправьте ему любое сообщение (например, `/start`)
4. Откройте в браузере: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
5. Найдите в ответе `"chat":{"id":123456789}` - это и есть ваш `TELEGRAM_CHAT_ID`

#### Вариант 2: Для группы
1. Добавьте бота в группу
2. Назначьте бота администратором (опционально)
3. Отправьте любое сообщение в группу
4. Откройте: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
5. Найдите `"chat":{"id":-123456789}` (для групп ID начинается с `-`)

### Шаг 4: Обновить .env на VPS

После получения токена и chat_id:

```bash
cd ~/projects/kodify/backend
nano .env
```

Добавьте или обновите строки:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

**Для группы:**
```env
TELEGRAM_CHAT_ID=-123456789
```

Сохраните файл (Ctrl+O, Enter, Ctrl+X).

### Шаг 5: Перезапустить бекенд

```bash
cd ~/projects/kodify/backend
docker-compose restart backend
```

Или пересоздать контейнер:

```bash
docker-compose down
docker-compose up -d
```

### Шаг 6: Проверить работу Telegram

#### Проверка через API тест:

```bash
curl https://api.kodifyweb.ru/api/test/telegram
```

Должен вернуть:
```json
{
  "success": true,
  "message": "Telegram bot is working"
}
```

#### Проверка логов бекенда:

```bash
docker-compose logs -f backend | grep -i telegram
```

Ищите строки:
- `✅ Telegram notification sent` - успешно отправлено
- `❌ Error sending Telegram notification` - ошибка отправки

### Шаг 7: Проверить логи при отправке формы

После отправки формы проверьте логи:

```bash
docker-compose logs --tail=50 backend
```

Ищите:
- `Contact form notification sent to Telegram successfully` - успешно
- `Error sending Telegram notification` - ошибка с деталями

## 🔍 Частые проблемы

### Проблема 1: "TELEGRAM_BOT_TOKEN is not set"

**Решение:** Добавьте `TELEGRAM_BOT_TOKEN` в `.env` файл и перезапустите бекенд.

### Проблема 2: "TELEGRAM_CHAT_ID is not set"

**Решение:** Добавьте `TELEGRAM_CHAT_ID` в `.env` файл и перезапустите бекенд.

### Проблема 3: "Unauthorized" или "Invalid token"

**Решение:** 
- Проверьте, правильно ли скопирован токен
- Убедитесь, что нет лишних пробелов
- Проверьте токен на `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getMe`

### Проблема 4: "Chat not found"

**Решение:**
- Убедитесь, что бот добавлен в группу/чат
- Убедитесь, что вы отправили боту сообщение (`/start`)
- Проверьте правильность `TELEGRAM_CHAT_ID` (для групп должен начинаться с `-`)

### Проблема 5: Бот не получает сообщения от группы

**Решение:**
- Добавьте бота в группу
- Отправьте в группу сообщение
- Получите chat_id через `getUpdates`

## 📝 Пример правильного .env

```env
NODE_ENV=production
PORT=3000

# Frontend
FRONTEND_URL=https://kodifyweb.ru
FRONTEND_URLS=https://kodifyweb.ru,http://kodifyweb.ru

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=kodify_db
DB_USER=kodify_user
DB_PASSWORD=ваш_пароль_бд

# Public URL
PUBLIC_URL=https://api.kodifyweb.ru

# Telegram (обязательно для уведомлений)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

## ✅ После настройки

1. Отправьте тестовую форму на сайте
2. Проверьте Telegram - должно прийти уведомление
3. Проверьте логи: `docker-compose logs backend | tail -20`

Если все настроено правильно, заявки будут приходить в Telegram автоматически! 📱
