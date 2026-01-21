# ⚡ Быстрое обновление .env на сервере

## ✅ Что уже сделано:

1. ✅ Файл `ENV_PRODUCTION_EXAMPLE.txt` обновлён с правильным токеном
2. ✅ Файл запушен в Git

---

## 🚀 Как обновить .env на сервере (3 команды):

### Вариант 1: Заменить весь .env (если нужно обновить всё)

```bash
cd ~/projects/kodify/backend
git pull
cp ENV_PRODUCTION_EXAMPLE.txt .env
docker-compose restart backend
```

### Вариант 2: Обновить только токен Telegram (рекомендуется)

```bash
cd ~/projects/kodify/backend
git pull
sed -i 's/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA/' .env
docker-compose restart backend
```

### Вариант 3: Одна команда (всё сразу)

```bash
cd ~/projects/kodify/backend && git pull && sed -i 's/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA/' .env && docker-compose restart backend
```

---

## ✅ Проверка:

```bash
# Проверить токен в контейнере
docker-compose exec backend env | grep TELEGRAM_BOT_TOKEN

# Проверить API
curl https://api.kodifyweb.ru/api/test/telegram
```

Должно вернуть: `{"success":true,"message":"Telegram bot is working"}`

---

## 📋 Токен бота:

```
8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA
```

**Важно:** Обратите внимание на подчеркивание `_` между `TmKb` и `bLbl2`!
