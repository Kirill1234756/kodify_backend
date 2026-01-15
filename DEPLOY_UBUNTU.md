# Полный план развертывания бэкенда на Ubuntu сервере

Этот документ содержит пошаговую инструкцию по развертыванию бэкенда на Ubuntu сервере с использованием Docker и Docker Compose.

## Требования

- Ubuntu 20.04 или новее (рекомендуется 22.04 LTS)
- Минимум 1GB RAM (рекомендуется 2GB)
- Минимум 10GB свободного места на диске
- Root доступ или пользователь с правами sudo
- Доступ к серверу по SSH

## Шаг 1: Подготовка сервера

### 1.1. Подключение к серверу

**Важно:** Замените `your-server-ip` на IP адрес вашего сервера!

Для вашего сервера на sweb.ru:

```bash
ssh root@89.111.142.190
```

**Где взять пароль для входа?**

1. **Проверьте email**, который вы указали при регистрации на sweb.ru - туда обычно приходит письмо с паролем
2. **В панели управления sweb.ru:**

   - Зайдите в раздел "Виртуальные серверы"
   - Выберите ваш VPS (`kirilltatn_vps_1`)
   - В разделе "Доступ" должен быть указан пароль или кнопка "Показать пароль"
   - Или нажмите "Сбросить пароль" и получите новый пароль

3. **Если пароль не работает через SSH:**
   - Используйте VNC-консоль из панели sweb.ru (кнопка "Перейти в VNC-консоль")
   - Войдите через VNC как `root` (не `kirilltatn`)
   - После входа через VNC, смените пароль: `passwd root`
   - Затем попробуйте SSH снова

**Альтернативные способы подключения:**

```bash
# Способ 1: Через root (основной способ)
ssh root@89.111.142.190

# Способ 2: Если создан другой пользователь
ssh kirilltatn@89.111.142.190

# Способ 3: Указать порт (если SSH на нестандартном порту)
ssh -p 22 root@89.111.142.190
```

**Если SSH не работает:**

На sweb.ru SSH обычно включен по умолчанию, но проверьте:

- В панели управления VPS должна быть включена опция SSH
- Порт 22 должен быть открыт (обычно открыт по умолчанию)
- Используйте VNC консоль для первичной настройки

### 1.2. Обновление системы

```bash
# Обновляем список пакетов
sudo apt update

# Обновляем установленные пакеты
sudo apt upgrade -y

# Устанавливаем необходимые инструменты
sudo apt install -y curl wget git ufw fail2ban
```

### 1.3. Настройка файрвола (UFW)

```bash
# Разрешаем SSH (важно сделать первым!)
sudo ufw allow OpenSSH

# Разрешаем HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Если нужно открыть порт бэкенда напрямую (не рекомендуется в production)
# sudo ufw allow 3000/tcp

# Включаем файрвол
sudo ufw --force enable

# Проверяем статус
sudo ufw status
```

### 1.4. Создание пользователя для приложения (опционально, но рекомендуется)

```bash
# Создаем пользователя
sudo adduser kodify

# Добавляем в группу sudo (если нужны права)
sudo usermod -aG sudo kodify

# Переключаемся на нового пользователя
su - kodify
```

## Шаг 2: Установка Docker и Docker Compose

### 2.1. Установка Docker

```bash
# Удаляем старые версии (если есть)
sudo apt remove -y docker docker-engine docker.io containerd runc

# Устанавливаем необходимые пакеты
sudo apt install -y ca-certificates curl gnupg lsb-release

# Добавляем официальный GPG ключ Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Настраиваем репозиторий
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Проверяем установку
docker --version
docker compose version
```

### 2.2. Настройка Docker (опционально)

```bash
# Добавляем текущего пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER

# Применяем изменения (или перелогиниваемся)
newgrp docker

# Проверяем, что Docker работает
docker run hello-world
```

### 2.3. Настройка автозапуска Docker

```bash
# Включаем автозапуск Docker
sudo systemctl enable docker
sudo systemctl start docker

# Проверяем статус
sudo systemctl status docker
```

## Шаг 3: Подготовка проекта

### 3.1. Клонирование репозитория

```bash
# Создаем директорию для проектов
mkdir -p ~/projects
cd ~/projects

# Клонируем репозиторий (замените на ваш URL)
git clone https://github.com/your-username/your-repo.git it-company
# или загрузите проект через scp/sftp

cd it-company/backend
```

### 3.2. Альтернатива: Загрузка проекта вручную

Если у вас нет Git репозитория:

```bash
# На локальной машине (Windows)
# Создайте архив проекта, исключив node_modules, .git и другие ненужные файлы

# На сервере создаем директорию
mkdir -p ~/projects/it-company
cd ~/projects/it-company

# Загружаем файлы через scp (с локальной машины)
# scp -r backend/ user@server:~/projects/it-company/
```

## Шаг 4: Настройка переменных окружения

### 4.1. Создание .env файла

```bash
cd ~/projects/it-company/backend

# Копируем пример конфигурации
cp ENV_EXAMPLE.txt .env

# Редактируем .env файл
nano .env
# или
vi .env
```

### 4.2. Настройка переменных в .env

```env
# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
FRONTEND_URLS=https://yourdomain.com,https://www.yourdomain.com

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=kodify_db
DB_USER=kodify_user
DB_PASSWORD=your_secure_password_here

# File Storage
UPLOAD_DIR=./uploads
PUBLIC_URL=https://yourdomain.com

# Email (если используется)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=admin@yourdomain.com

# Telegram (если используется)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Bitrix24 (опционально)
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_token/
```

**Важно:**

- Используйте сильные пароли для `DB_PASSWORD`
- Генерируйте безопасные пароли: `openssl rand -base64 32`
- Не коммитьте `.env` файл в Git!

### 4.3. Защита .env файла

```bash
# Устанавливаем правильные права доступа
chmod 600 .env

# Убеждаемся, что .env в .gitignore
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
```

## Шаг 5: Развертывание с Docker Compose

### 5.1. Сборка и запуск контейнеров

```bash
cd ~/projects/it-company/backend

# Собираем образы
docker compose build

# Запускаем контейнеры в фоновом режиме
docker compose up -d

# Проверяем статус контейнеров
docker compose ps

# Смотрим логи
docker compose logs -f
```

### 5.2. Проверка работы

```bash
# Проверяем health check бэкенда
curl http://localhost:3000/health

# Проверяем логи бэкенда
docker compose logs backend

# Проверяем логи базы данных
docker compose logs postgres
```

### 5.3. Инициализация базы данных (если нужно)

Если в `sql/migrations/` есть файлы для инициализации, они выполнятся автоматически при первом запуске PostgreSQL.

Для ручной инициализации:

```bash
# Подключаемся к контейнеру базы данных
docker compose exec postgres psql -U kodify_user -d kodify_db

# Или выполняем SQL файл
docker compose exec -T postgres psql -U kodify_user -d kodify_db < sql/migrations/001_create_tables.sql
```

## Шаг 6: Настройка Nginx (Reverse Proxy)

### 6.1. Установка Nginx

```bash
sudo apt install -y nginx

# Проверяем статус
sudo systemctl status nginx
```

### 6.2. Настройка конфигурации Nginx

```bash
# Создаем конфигурационный файл
sudo nano /etc/nginx/sites-available/kodify-backend
```

Добавьте следующую конфигурацию:

```nginx
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Логи
    access_log /var/log/nginx/kodify-backend-access.log;
    error_log /var/log/nginx/kodify-backend-error.log;

    # Максимальный размер загружаемого файла
    client_max_body_size 20M;

    # Проксирование запросов к бэкенду
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статические файлы (uploads)
    location /uploads/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
}
```

### 6.3. Активация конфигурации

```bash
# Создаем символическую ссылку
sudo ln -s /etc/nginx/sites-available/kodify-backend /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию (опционально)
sudo rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
sudo nginx -t

# Перезагружаем Nginx
sudo systemctl reload nginx
```

### 6.4. Настройка SSL с Let's Encrypt (HTTPS)

```bash
# Устанавливаем Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получаем SSL сертификат
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot автоматически настроит Nginx для HTTPS
# Сертификат будет автоматически обновляться
```

## Шаг 7: Настройка автозапуска и мониторинга

### 7.1. Настройка автозапуска Docker Compose

Docker Compose по умолчанию использует `restart: unless-stopped` в `docker-compose.yml`, поэтому контейнеры будут автоматически перезапускаться при перезагрузке сервера.

### 7.2. Создание systemd service (опционально, для дополнительного контроля)

```bash
sudo nano /etc/systemd/system/kodify-backend.service
```

Добавьте:

```ini
[Unit]
Description=Kodify Backend Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/kodify/projects/it-company/backend
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Активируйте сервис:

```bash
sudo systemctl daemon-reload
sudo systemctl enable kodify-backend
sudo systemctl start kodify-backend
```

## Шаг 8: Настройка резервного копирования

### 8.1. Резервное копирование базы данных

Создайте скрипт для бэкапа:

```bash
nano ~/backup-db.sh
```

Добавьте:

```bash
#!/bin/bash
BACKUP_DIR="/home/kodify/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kodify_db_$DATE.sql"

mkdir -p $BACKUP_DIR

# Создаем бэкап базы данных
docker compose exec -T postgres pg_dump -U kodify_user kodify_db > $BACKUP_FILE

# Сжимаем бэкап
gzip $BACKUP_FILE

# Удаляем старые бэкапы (старше 30 дней)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Сделайте скрипт исполняемым:

```bash
chmod +x ~/backup-db.sh
```

Добавьте в cron для автоматического бэкапа:

```bash
crontab -e
```

Добавьте строку (бэкап каждый день в 3:00):

```
0 3 * * * /home/kodify/backup-db.sh >> /home/kodify/backup.log 2>&1
```

### 8.2. Резервное копирование файлов uploads

```bash
nano ~/backup-uploads.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/kodify/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/uploads_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

# Создаем архив uploads
tar -czf $BACKUP_FILE -C ~/projects/it-company/backend uploads

# Удаляем старые бэкапы (старше 30 дней)
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete

echo "Uploads backup completed: $BACKUP_FILE"
```

```bash
chmod +x ~/backup-uploads.sh
```

## Шаг 9: Мониторинг и логирование

### 9.1. Просмотр логов

```bash
# Все логи
docker compose logs -f

# Только бэкенд
docker compose logs -f backend

# Только база данных
docker compose logs -f postgres

# Последние 100 строк
docker compose logs --tail=100 backend
```

### 9.2. Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Дисковое пространство
df -h
docker system df

# Проверка здоровья контейнеров
docker compose ps
```

## Шаг 10: Обновление приложения

### 10.1. Обновление кода

```bash
cd ~/projects/it-company/backend

# Если используете Git
git pull origin main

# Пересобираем образы
docker compose build

# Перезапускаем контейнеры
docker compose up -d

# Проверяем логи
docker compose logs -f backend
```

### 10.2. Откат изменений (если что-то пошло не так)

```bash
# Останавливаем контейнеры
docker compose down

# Возвращаемся к предыдущей версии кода (Git)
git checkout previous-commit-hash

# Перезапускаем
docker compose up -d
```

## Полезные команды

### Управление контейнерами

```bash
# Запуск
docker compose up -d

# Остановка
docker compose down

# Перезапуск
docker compose restart

# Перезапуск конкретного сервиса
docker compose restart backend

# Просмотр статуса
docker compose ps

# Просмотр логов
docker compose logs -f [service_name]
```

### Управление базой данных

```bash
# Подключение к базе данных
docker compose exec postgres psql -U kodify_user -d kodify_db

# Создание бэкапа
docker compose exec -T postgres pg_dump -U kodify_user kodify_db > backup.sql

# Восстановление из бэкапа
docker compose exec -T postgres psql -U kodify_user -d kodify_db < backup.sql
```

### Очистка

```bash
# Удаление неиспользуемых образов
docker image prune -a

# Удаление неиспользуемых volumes
docker volume prune

# Полная очистка (осторожно!)
docker system prune -a --volumes
```

## Устранение проблем

### Проблема: Контейнер не запускается

```bash
# Проверяем логи
docker compose logs backend

# Проверяем статус
docker compose ps

# Проверяем переменные окружения
docker compose config
```

### Проблема: База данных недоступна

```bash
# Проверяем логи PostgreSQL
docker compose logs postgres

# Проверяем подключение
docker compose exec postgres pg_isready -U kodify_user

# Проверяем переменные окружения БД
docker compose exec backend env | grep DB_
```

### Проблема: Порт уже занят

```bash
# Проверяем, что использует порт
sudo netstat -tulpn | grep :3000
# или
sudo lsof -i :3000

# Останавливаем конфликтующий процесс или меняем порт в .env
```

### Проблема: Недостаточно места на диске

```bash
# Очищаем неиспользуемые Docker ресурсы
docker system prune -a

# Проверяем использование места
docker system df
df -h
```

## Безопасность

1. **Регулярно обновляйте систему:**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Используйте сильные пароли** для всех сервисов

3. **Не открывайте порт 5432 (PostgreSQL)** в файрволе - он доступен только внутри Docker сети

4. **Регулярно делайте бэкапы** базы данных и файлов

5. **Мониторьте логи** на подозрительную активность

6. **Используйте HTTPS** везде в production

7. **Ограничьте SSH доступ** только с доверенных IP (опционально)

## Проверочный список развертывания

- [ ] Сервер обновлен и настроен
- [ ] Docker и Docker Compose установлены
- [ ] Проект загружен на сервер
- [ ] `.env` файл создан и настроен
- [ ] База данных инициализирована
- [ ] Контейнеры запущены и работают
- [ ] Health check проходит успешно
- [ ] Nginx настроен и работает
- [ ] SSL сертификат установлен (HTTPS)
- [ ] Резервное копирование настроено
- [ ] Мониторинг настроен
- [ ] Документация обновлена

## Поддержка

При возникновении проблем:

1. Проверьте логи: `docker compose logs -f`
2. Проверьте статус контейнеров: `docker compose ps`
3. Проверьте конфигурацию: `docker compose config`
4. Обратитесь к документации проекта
