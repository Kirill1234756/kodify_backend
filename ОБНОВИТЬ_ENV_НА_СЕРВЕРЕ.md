# 🔄 Как обновить .env на сервере

## ⚠️ ВАЖНО: Файл .env.production содержит реальный токен!

Этот файл нужен как шаблон. На сервере используйте его для обновления вашего `.env`.

---

## 📋 Способ 1: Через Git (рекомендуется)

### Шаг 1: Проверьте что файл добавлен в Git

```bash
cd ~/projects/kodify/backend
git pull
```

### Шаг 2: Скопируйте файл в .env на сервере

```bash
cp .env.production .env
```

Или если нужно сохранить существующие настройки (например, пароль БД):

```bash
# Создайте бэкап текущего .env
cp .env .env.backup

# Обновите только токен Telegram из нового файла
grep TELEGRAM_BOT_TOKEN .env.production >> .env.tmp
sed -i '/TELEGRAM_BOT_TOKEN=/d' .env
cat .env.tmp >> .env
rm .env.tmp
```

### Шаг 3: Перезапустите контейнер

```bash
docker-compose restart backend
```

---

## 📋 Способ 2: Через sed (только обновить токен)

Если нужно обновить только токен Telegram:

```bash
cd ~/projects/kodify/backend
sed -i 's/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA/' .env
docker-compose restart backend
```

---

## 📋 Способ 3: Вручную через nano

1. Обновите код:

   ```bash
   cd ~/projects/kodify/backend
   git pull
   ```

2. Откройте nano:

   ```bash
   nano .env
   ```

3. Найдите строку `TELEGRAM_BOT_TOKEN=...`

4. Замените на:

   ```
   TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA
   ```

5. Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

6. Перезапустите:
   ```bash
   docker-compose restart backend
   ```

---

## ✅ Проверка после обновления

### 1. Проверьте что токен обновился:

```bash
docker-compose exec backend env | grep TELEGRAM_BOT_TOKEN
```

Должно показать:

```
TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA
```

### 2. Проверьте тестовый endpoint:

```bash
curl https://api.kodifyweb.ru/api/test/telegram
```

Должно вернуть:

```json
{
  "success": true,
  "message": "Telegram bot is working"
}
```

### 3. Проверьте логи:

```bash
docker-compose logs --tail=20 backend | grep -i telegram
```

Должны увидеть успешные сообщения без ошибок `401 Unauthorized`.

---

## 🔒 Безопасность

**⚠️ ВАЖНО:** Файл `.env.production` содержит реальный токен бота.

- ✅ Можно использовать на сервере
- ✅ Можно коммитить в приватный репозиторий
- ❌ НЕ публикуйте в открытых репозиториях
- ❌ НЕ делитесь токеном публично

Если репозиторий публичный, удалите токен из файла перед коммитом:

```bash
sed -i 's/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=your_telegram_bot_token/' .env.production
```

---

## 🎯 Быстрая команда (все в одном):

```bash
cd ~/projects/kodify/backend && \
git pull && \
sed -i 's/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA/' .env && \
docker-compose restart backend && \
echo "✅ Обновлено! Проверьте: curl https://api.kodifyweb.ru/api/test/telegram"
```
