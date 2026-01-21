# 🔧 Исправление ошибок на VPS

## Проблемы, которые нужно исправить:

1. ❌ `ETELEGRAM: 401 Unauthorized` - неправильный токен Telegram
2. ❌ `Endpoint not found` - старый код на VPS
3. ❌ `PUBLIC_URL` использует `http://` вместо `https://`

## ✅ Решение:

### Шаг 1: Обновить код на VPS

Подключитесь к VPS через VNC или SSH:

```bash
cd ~/projects/kodify/backend
git pull
```

### Шаг 2: Исправить `.env` файл

Откройте `.env` файл:

```bash
nano .env
```

**Исправьте следующие строки:**

#### 1. Исправьте токен Telegram (уберите лишний `_` в конце):

```env
# БЫЛО (неправильно):
TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX40TmKb-bLb12FwTgzGyA_

# ДОЛЖНО БЫТЬ (правильно):
TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX40TmKb_bLb12FwTgzGyA
```

**Важно:** В BotFather токен заканчивается на `A`, а не на `A_`. Уберите подчеркивание в конце!

#### 2. Исправьте PUBLIC_URL (используйте https):

```env
# БЫЛО (неправильно):
PUBLIC_URL=http://api.kodifyweb.ru

# ДОЛЖНО БЫТЬ (правильно):
PUBLIC_URL=https://api.kodifyweb.ru
```

### Шаг 3: Сохраните файл

В nano:

- `Ctrl+O` (сохранить)
- `Enter` (подтвердить имя файла)
- `Ctrl+X` (выйти)

### Шаг 4: Перезапустите бекенд

```bash
docker-compose restart backend
```

Или пересоздайте контейнер (если нужно):

```bash
docker-compose down
docker-compose up -d
```

### Шаг 5: Проверьте работу

#### Проверка 1: Проверьте, что endpoint работает:

```bash
curl https://api.kodifyweb.ru/api/test/telegram
```

Должно вернуть JSON ответ (не "Endpoint not found").

#### Проверка 2: Проверьте логи:

```bash
docker-compose logs -f backend | grep -i telegram
```

Ищите:

- ✅ `Telegram bot configuration test successful` - успех
- ❌ `ETELEGRAM: 401 Unauthorized` - все еще ошибка токена

#### Проверка 3: Отправьте тестовую форму

Откройте сайт и отправьте форму. Затем проверьте логи:

```bash
docker-compose logs --tail=50 backend
```

Ищите:

- ✅ `Contact form notification sent to Telegram successfully` - успех
- ❌ `Error sending Telegram notification` - ошибка

## 🔍 Частые проблемы:

### Проблема: Все еще `401 Unauthorized`

**Решения:**

1. Проверьте токен - скопируйте его заново из BotFather
2. Убедитесь, что нет лишних пробелов в начале/конце
3. Убедитесь, что нет лишнего символа `_` в конце
4. Проверьте токен через браузер:
   ```
   https://api.telegram.org/bot<ВАШ_ТОКЕН>/getMe
   ```
   Должен вернуть информацию о боте

### Проблема: Бот не получает сообщения

**Решения:**

1. Убедитесь, что бот добавлен в группу/чат
2. Убедитесь, что chat_id правильный:
   - Для личного чата: положительное число
   - Для группы: отрицательное число (начинается с `-`)
3. Отправьте боту `/start` в личном чате
4. В группе дайте боту права администратора (опционально)

### Проблема: Endpoint not found

**Решения:**

1. Убедитесь, что выполнили `git pull`
2. Убедитесь, что перезапустили контейнер
3. Проверьте, что код обновился:
   ```bash
   docker-compose exec backend cat /app/src/server.ts | grep "test/telegram"
   ```

## 📝 Пример правильного .env:

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
DB_PASSWORD=ваш_пароль

# Public URL (ОБЯЗАТЕЛЬНО https!)
PUBLIC_URL=https://api.kodifyweb.ru

# Telegram (БЕЗ лишних символов!)
TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX40TmKb_bLb12FwTgzGyA
TELEGRAM_CHAT_ID=-1003136896464
```

## ✅ После исправления:

1. Endpoint `/api/test/telegram` должен работать
2. Ошибки `401 Unauthorized` должны исчезнуть
3. Заявки должны приходить в Telegram
