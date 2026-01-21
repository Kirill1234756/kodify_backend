# 📋 Пошаговая инструкция: Обновить .env на сервере

## ✅ Файл `env.production.full` УЖЕ В GIT!

Файл точно добавлен и запушен в репозиторий. Если вы его не видите на сервере, выполните следующие шаги:

---

## 🔍 Шаг 1: Проверить что файл есть в Git (на сервере)

```bash
cd ~/projects/kodify/backend
git pull
ls -la env.production.full
```

Если файл есть, увидите: `env.production.full`

---

## 📥 Шаг 2: Если файла нет, принудительно обновить Git

```bash
cd ~/projects/kodify/backend
git fetch origin
git reset --hard origin/main
ls -la env.production.full
```

---

## 📋 Шаг 3: Скопировать файл в .env

### Вариант А: Полная замена .env (рекомендуется)

```bash
# Создать бэкап текущего .env (на всякий случай)
cp .env .env.backup

# Скопировать новый файл
cp env.production.full .env

# Проверить что скопировалось
cat .env | grep TELEGRAM_BOT_TOKEN
```

Должно показать:
```
TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA
```

### Вариант Б: Обновить только токен (если не хотите менять остальное)

```bash
sed -i 's/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA/' .env
```

---

## 🔄 Шаг 4: Перезапустить контейнер

```bash
docker-compose restart backend
```

---

## ✅ Шаг 5: Проверить что всё работает

### Проверить токен в контейнере:
```bash
docker-compose exec backend env | grep TELEGRAM_BOT_TOKEN
```

### Проверить API:
```bash
curl https://api.kodifyweb.ru/api/test/telegram
```

Должно вернуть:
```json
{"success":true,"message":"Telegram bot is working"}
```

---

## 🎯 Одна команда (всё сразу):

```bash
cd ~/projects/kodify/backend && \
git fetch origin && \
git reset --hard origin/main && \
cp env.production.full .env && \
docker-compose restart backend && \
echo "✅ Обновлено! Проверьте: curl https://api.kodifyweb.ru/api/test/telegram"
```

---

## ⚠️ Если файл всё равно не найден:

### Проверить что вы в правильной директории:
```bash
pwd
# Должно показать: /home/your_user/projects/kodify/backend
```

### Проверить все файлы в директории:
```bash
ls -la | grep env
```

### Проверить последний коммит:
```bash
git log --oneline -5
# Должен быть коммит: "Add complete production .env file with all settings"
```

### Если файла всё равно нет, создать его вручную:
```bash
cat > env.production.full << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://kodifyweb.ru
FRONTEND_URLS=https://kodifyweb.ru,https://www.kodifyweb.ru
DB_HOST=postgres
DB_PORT=5432
DB_NAME=kodify_db
DB_USER=postgres
DB_PASSWORD=postgres
UPLOAD_DIR=./uploads
PUBLIC_URL=https://api.kodifyweb.ru
TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA
TELEGRAM_CHAT_ID=-1003136896464
EOF
```

---

## 📝 Важно: Правильный токен

```
8226522901:AAHJSZ8zpZ-UCSX4OTmKb_bLbl2FwTgzGyA
              ↑                    ↑
         Заглавная O          bLbl2 (буква l, цифра 2)
```

**Обратите внимание:**
- `UCSX4OTmKb` - с заглавной **O** (не цифра 0)
- `bLbl2FwTgzGyA` - буква **l** перед цифрой 2 (не 12)
