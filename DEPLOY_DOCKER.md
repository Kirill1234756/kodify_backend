# 🐳 Установка бэкенда на sweb.ru через Docker

## ✅ Преимущества Docker-деплоя

- ✅ Docker уже установлен на вашем VPS
- ✅ Все зависимости изолированы
- ✅ Легко обновлять и откатывать
- ✅ PostgreSQL в отдельном контейнере
- ✅ Автоматический перезапуск при сбоях
- ✅ Простое масштабирование

---

## 📋 Предварительные требования

- VPS с Docker (уже установлен на sweb.ru)
- Доступ по SSH
- Доменное имя (опционально)

---

## 🚀 Быстрая установка

### Шаг 1: Подключение к серверу

```bash
ssh root@ваш_IP_адрес
```

### Шаг 2: Установка Docker Compose (если не установлен)

```bash
# Проверка установки Docker
docker --version

# Установка Docker Compose
sudo apt update
sudo apt install docker-compose-plugin -y

# Или для старых версий
sudo apt install docker-compose -y

# Проверка
docker compose version
```

### Шаг 3: Загрузка кода на сервер

**Вариант A: Через Git (рекомендуется)**

```bash
# Установка Git
sudo apt install git -y

# Создание директории
mkdir -p /var/www/it-company
cd /var/www/it-company

# Клонирование репозитория
git clone https://github.com/ваш-username/it-company.git .
cd backend
```

**Вариант B: Через SCP (с локального ПК)**

На вашем Windows компьютере:
```powershell
cd C:\Users\user\Desktop\it-company
scp -r backend root@ваш_IP:/var/www/it-company/
```

На сервере:
```bash
cd /var/www/it-company/backend
```

### Шаг 4: Настройка переменных окружения

```bash
# Создание .env файла
nano .env
```

Вставьте конфигурацию (замените значения):

```env
# Server Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://ваш-домен.com
FRONTEND_URLS=https://ваш-домен.com,http://ваш-домен.com

# Database Configuration
DB_NAME=kodify_db
DB_USER=kodify_user
DB_PASSWORD=ваш_надежный_пароль_для_БД

# File Storage
PUBLIC_URL=https://ваш-домен.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ваш_email@gmail.com
SMTP_PASS=ваш_app_password
ADMIN_EMAIL=admin@ваш-домен.com

# Telegram
TELEGRAM_BOT_TOKEN=ваш_токен
TELEGRAM_CHAT_ID=ваш_chat_id

# Bitrix24 (опционально)
# BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_token/
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 5: Инициализация базы данных

```bash
# Запуск контейнеров
docker compose up -d postgres

# Ждем пока PostgreSQL запустится (10-15 секунд)
sleep 15

# Применение миграций
docker compose exec postgres psql -U kodify_user -d kodify_db -f /docker-entrypoint-initdb.d/init.sql

# Или загрузите миграции вручную
docker compose exec postgres psql -U kodify_user -d kodify_db < sql/migrations/001_create_tables.sql

# Проверка подключения
docker compose exec postgres psql -U kodify_user -d kodify_db -c "\dt"
```

### Шаг 6: Сборка и запуск

```bash
# Сборка и запуск всех сервисов
docker compose up -d --build

# Просмотр логов
docker compose logs -f

# Проверка статуса
docker compose ps
```

### Шаг 7: Проверка работы

```bash
# Проверка здоровья приложения
curl http://localhost:3000/health

# Просмотр логов
docker compose logs backend
docker compose logs postgres
```

---

## 🔄 Управление контейнерами

### Основные команды

```bash
# Запуск всех сервисов
docker compose up -d

# Остановка всех сервисов
docker compose stop

# Остановка и удаление контейнеров
docker compose down

# Перезапуск сервиса
docker compose restart backend

# Просмотр логов
docker compose logs -f backend
docker compose logs -f postgres

# Выполнение команд в контейнере
docker compose exec backend sh
docker compose exec postgres psql -U kodify_user -d kodify_db
```

### Обновление приложения

```bash
cd /var/www/it-company/backend

# Получение обновлений (если используете Git)
git pull

# Пересборка и перезапуск
docker compose up -d --build

# Просмотр логов
docker compose logs -f backend
```

---

## 🌐 Настройка Nginx (опционально)

```bash
# Установка Nginx
sudo apt install nginx -y

# Создание конфигурации
sudo nano /etc/nginx/sites-available/kodify-backend
```

Конфигурация Nginx:

```nginx
server {
    listen 80;
    server_name ваш-домен.com www.ваш-домен.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активация:

```bash
sudo ln -s /etc/nginx/sites-available/kodify-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d ваш-домен.com -d www.ваш-домен.com
```

---

## 🔍 Решение проблем

### Контейнер не запускается

```bash
# Просмотр логов
docker compose logs backend

# Проверка статуса
docker compose ps

# Пересборка образа
docker compose build --no-cache backend
docker compose up -d backend
```

### Проблемы с базой данных

```bash
# Проверка статуса PostgreSQL
docker compose ps postgres

# Просмотр логов
docker compose logs postgres

# Подключение к БД
docker compose exec postgres psql -U kodify_user -d kodify_db
```

### Проблемы с памятью (1 ГБ RAM может быть мало)

Если контейнеры не запускаются из-за нехватки памяти:

```bash
# Проверка использования памяти
free -h
docker stats

# Оптимизация: использование Alpine образов (уже используются)
# Можно отключить ненужные сервисы в docker-compose.yml
```

### Очистка Docker

```bash
# Удаление неиспользуемых образов
docker image prune -a

# Удаление неиспользуемых volumes
docker volume prune

# Полная очистка (осторожно!)
docker system prune -a --volumes
```

---

## 📊 Мониторинг

### Проверка ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Логи в реальном времени
docker compose logs -f

# Информация о контейнерах
docker compose ps
```

---

## ✅ Чек-лист после установки

- [ ] Docker и Docker Compose установлены
- [ ] Код загружен на сервер
- [ ] .env файл настроен
- [ ] Контейнеры запущены (`docker compose ps`)
- [ ] База данных инициализирована
- [ ] API отвечает (`curl http://localhost:3000/health`)
- [ ] Nginx настроен (если используется)
- [ ] SSL сертификат установлен (если используется)

---

## 💡 Полезные советы

1. **Автозапуск при перезагрузке**: Docker Compose автоматически перезапускает контейнеры благодаря `restart: unless-stopped`

2. **Бэкапы базы данных**:
```bash
# Создание бэкапа
docker compose exec postgres pg_dump -U kodify_user kodify_db > backup.sql

# Восстановление
docker compose exec -T postgres psql -U kodify_user kodify_db < backup.sql
```

3. **Обновление зависимостей**:
```bash
docker compose build --no-cache
docker compose up -d
```

4. **Просмотр логов за последний час**:
```bash
docker compose logs --since 1h backend
```




