# 🚀 Настройка для продакшена с доменами kodifyweb.ru

## 📋 Обзор доменов

- **Фронтенд:** `https://kodifyweb.ru` (основной сайт)
- **API Backend:** `https://api.kodifyweb.ru` (API поддомен)
- **IP сервера:** `89.111.142.190`

## 🔧 Необходимые изменения на сервере

### 1. Обновить `.env` файл

На сервере отредактируйте `.env` файл:

```bash
cd ~/projects/it-company/backend
nano .env
```

Убедитесь, что указаны правильные домены:

```env
NODE_ENV=production
PORT=3000

# Frontend URL (основной домен для CORS)
FRONTEND_URL=https://kodifyweb.ru
FRONTEND_URLS=https://kodifyweb.ru,http://kodifyweb.ru

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=kodify_db
DB_USER=kodify_user
DB_PASSWORD=ваш_пароль

# File Storage (API домен)
PUBLIC_URL=https://api.kodifyweb.ru

# Остальные настройки...
```

### 2. Обновить конфигурацию Nginx

Убедитесь, что в `/etc/nginx/sites-available/kodify-backend` указан правильный домен:

```nginx
server {
    listen 80;
    server_name api.kodifyweb.ru;
    # ... остальная конфигурация
}
```

Проверьте и перезагрузите Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Установить SSL сертификат

Сертификат уже получен, но не установлен. Установите его:

```bash
sudo certbot install --cert-name api.kodifyweb.ru
```

Или перезапустите certbot:

```bash
sudo certbot --nginx -d api.kodifyweb.ru --redirect
```

Certbot автоматически обновит конфигурацию Nginx для HTTPS.

### 4. Перезапустить контейнеры

После изменения `.env` перезапустите backend:

```bash
cd ~/projects/it-company/backend
docker-compose down
docker-compose up -d
```

### 5. Проверить работу

```bash
# Health check через HTTP (локально)
curl http://localhost:3000/health

# Health check через HTTPS (через домен)
curl https://api.kodifyweb.ru/health
```

## 🔐 Настройка фронтенда

Во фронтенде (на сервере или при сборке) создайте `.env` файл:

```env
VITE_API_URL=https://api.kodifyweb.ru/api
```

Или обновите существующий `.env` файл во фронтенде.

## ✅ Чеклист перед запуском

- [ ] DNS A-запись для `api.kodifyweb.ru` → `89.111.142.190` настроена в reg.ru
- [ ] `.env` файл обновлен с правильными доменами
- [ ] Nginx конфигурация обновлена с `server_name api.kodifyweb.ru;`
- [ ] SSL сертификат установлен через Certbot
- [ ] Docker контейнеры перезапущены
- [ ] Health check работает: `https://api.kodifyweb.ru/health`
- [ ] Фронтенд обновлен с `VITE_API_URL=https://api.kodifyweb.ru/api`
- [ ] CORS настроен правильно (FRONTEND_URL указывает на `https://kodifyweb.ru`)

## 📝 Важные заметки

1. **FRONTEND_URL** должен указывать на основной домен фронтенда (`kodifyweb.ru`), а не на API
2. **PUBLIC_URL** должен указывать на API домен (`api.kodifyweb.ru`) для доступа к загруженным файлам
3. **VITE_API_URL** во фронтенде должен указывать на `https://api.kodifyweb.ru/api`
4. После изменения `.env` всегда перезапускайте контейнеры: `docker-compose down && docker-compose up -d`

## 🔍 Проверка DNS

Проверить, что DNS настроен правильно:

```bash
# Проверка A-записи
nslookup api.kodifyweb.ru

# Или
dig api.kodifyweb.ru A

# Должен вернуть: 89.111.142.190
```

## 📚 Дополнительные файлы

- `ENV_PRODUCTION_EXAMPLE.txt` - пример конфигурации для продакшена
- `nginx/kodify-backend.conf` - конфигурация Nginx (уже обновлена)
- `DEPLOY_UBUNTU.md` - полная инструкция по развертыванию
