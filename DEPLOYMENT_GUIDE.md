# 🚀 Руководство по установке бэкенда на sweb.ru (VPS)

## 📋 Предварительные требования

- Доступ к VPS серверу через SSH
- Ubuntu 24.04 LTS (или другая Linux-система)
- Доменное имя (опционально, но рекомендуется)

---

## 🔧 Шаг 1: Подключение к серверу

```bash
ssh root@ваш_IP_адрес
# или
ssh root@ваш_домен.com
```

После подключения обновите систему:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 📦 Шаг 2: Установка Node.js

### Вариант A: Установка через NodeSource (рекомендуется)

```bash
# Установка Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка установки
node --version
npm --version
```

### Вариант B: Использование nvm (для управления версиями)

```bash
# Установка nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Установка Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Проверка
node --version
```

---

## 🐘 Шаг 3: Установка PostgreSQL

```bash
# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Запуск службы
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Проверка статуса
sudo systemctl status postgresql

# Переключение на пользователя postgres
sudo -i -u postgres

# Создание пользователя и базы данных
createuser --interactive --pwprompt kodify_user
# Введите пароль для пользователя (запомните его!)

createdb kodify_db -O kodify_user

# Выход из пользователя postgres
exit
```

---

## 📁 Шаг 4: Загрузка кода на сервер

### Вариант A: Через Git (рекомендуется)

```bash
# Установка Git (если не установлен)
sudo apt install git -y

# Создание директории для проекта
mkdir -p /var/www
cd /var/www

# Клонирование репозитория (замените на ваш репозиторий)
git clone https://github.com/ваш-username/it-company.git
cd it-company/backend

# Или загрузите код через SCP/FTP
```

### Вариант B: Через SCP (с локального компьютера)

На вашем локальном компьютере (Windows PowerShell):
```powershell
# Перейдите в папку проекта
cd C:\Users\user\Desktop\it-company

# Загрузите папку backend на сервер
scp -r backend root@ваш_IP:/var/www/it-company/
```

---

## 🔐 Шаг 5: Настройка переменных окружения

```bash
cd /var/www/it-company/backend

# Создание .env файла
nano .env
```

Вставьте следующее содержимое (замените значения на ваши):

```env
# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://ваш-домен.com
FRONTEND_URLS=https://ваш-домен.com,http://ваш-домен.com

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kodify_db
DB_USER=kodify_user
DB_PASSWORD=ваш_пароль_от_базы_данных

# File Storage Configuration
UPLOAD_DIR=./uploads
PUBLIC_URL=https://ваш-домен.com

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ваш_email@gmail.com
SMTP_PASS=ваш_app_password
ADMIN_EMAIL=admin@ваш-домен.com

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=ваш_токен
TELEGRAM_CHAT_ID=ваш_chat_id

# Bitrix24 Configuration (опционально)
# BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_token/
```

Сохраните файл: `Ctrl+O`, затем `Enter`, затем `Ctrl+X`

---

## 🗄️ Шаг 6: Инициализация базы данных

```bash
# Применение миграций
sudo -u postgres psql -d kodify_db -f sql/migrations/001_create_tables.sql

# Или через пользователя kodify_user
psql -U kodify_user -d kodify_db -f sql/migrations/001_create_tables.sql
# Введите пароль, который вы создали ранее
```

---

## 📦 Шаг 7: Установка зависимостей и сборка

```bash
cd /var/www/it-company/backend

# Установка зависимостей
npm install

# Создание папки для загруженных файлов
mkdir -p uploads

# Сборка TypeScript проекта
npm run build

# Проверка, что сборка прошла успешно
ls -la dist/
```

---

## 🔄 Шаг 8: Установка PM2 (для автозапуска)

```bash
# Глобальная установка PM2
sudo npm install -g pm2

# Запуск приложения через PM2
pm2 start dist/server.js --name kodify-backend

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска при перезагрузке сервера
pm2 startup
# Выполните команду, которую PM2 покажет (обычно это sudo env PATH=...)

# Проверка статуса
pm2 status
pm2 logs kodify-backend
```

---

## 🌐 Шаг 9: Настройка Nginx (опционально, но рекомендуется)

```bash
# Установка Nginx
sudo apt install nginx -y

# Создание конфигурации
sudo nano /etc/nginx/sites-available/kodify-backend
```

Вставьте следующую конфигурацию:

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

Активация конфигурации:
```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/kodify-backend /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl restart nginx

# Автозапуск Nginx
sudo systemctl enable nginx
```

---

## 🔒 Шаг 10: Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение SSL сертификата
sudo certbot --nginx -d ваш-домен.com -d www.ваш-домен.com

# Автоматическое обновление сертификата
sudo certbot renew --dry-run
```

---

## ✅ Шаг 11: Проверка работы

```bash
# Проверка статуса PM2
pm2 status

# Проверка логов
pm2 logs kodify-backend

# Проверка работы API
curl http://localhost:3000/health

# Проверка через домен (если настроен Nginx)
curl https://ваш-домен.com/health
```

---

## 🛠️ Полезные команды PM2

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs kodify-backend

# Перезапуск приложения
pm2 restart kodify-backend

# Остановка приложения
pm2 stop kodify-backend

# Удаление приложения из PM2
pm2 delete kodify-backend

# Мониторинг
pm2 monit
```

---

## 🔄 Обновление приложения

```bash
cd /var/www/it-company/backend

# Получение обновлений (если используете Git)
git pull

# Установка новых зависимостей
npm install

# Пересборка проекта
npm run build

# Перезапуск через PM2
pm2 restart kodify-backend
```

---

## 🔍 Решение проблем

### Порт 3000 уже занят
```bash
# Проверка, какой процесс использует порт
sudo lsof -i :3000

# Остановка процесса
sudo kill -9 PID
```

### Проблемы с базой данных
```bash
# Проверка статуса PostgreSQL
sudo systemctl status postgresql

# Проверка подключения
psql -U kodify_user -d kodify_db -h localhost
```

### Проблемы с правами доступа
```bash
# Установка правильных прав на папку uploads
sudo chmod -R 755 /var/www/it-company/backend/uploads
sudo chown -R $USER:$USER /var/www/it-company/backend/uploads
```

---

## 📝 Чек-лист после установки

- [ ] Node.js установлен и работает
- [ ] PostgreSQL установлен и запущен
- [ ] База данных создана и миграции применены
- [ ] .env файл настроен
- [ ] Зависимости установлены
- [ ] Проект собран (npm run build)
- [ ] PM2 запущен и приложение работает
- [ ] Nginx настроен (если используется)
- [ ] SSL сертификат установлен (если используется)
- [ ] API отвечает на запросы

---

## 📞 Поддержка

При возникновении проблем проверьте логи:
- PM2: `pm2 logs kodify-backend`
- Nginx: `sudo tail -f /var/log/nginx/error.log`
- PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-*.log`

