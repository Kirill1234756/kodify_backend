# 🚀 Быстрая установка бэкенда на sweb.ru

## Быстрый старт (для опытных)

```bash
# 1. Подключение
ssh root@ваш_IP

# 2. Обновление системы
sudo apt update && sudo apt upgrade -y

# 3. Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 5. Создание базы данных
sudo -u postgres createuser --interactive --pwprompt kodify_user
sudo -u postgres createdb kodify_db -O kodify_user

# 6. Загрузка кода (через SCP с локального ПК)
# На Windows: scp -r backend root@IP:/var/www/it-company/

# 7. Настройка проекта
cd /var/www/it-company/backend
npm install
mkdir -p uploads
npm run build

# 8. Настройка .env
nano .env
# Заполните переменные окружения

# 9. Инициализация БД
sudo -u postgres psql -d kodify_db -f sql/migrations/001_create_tables.sql

# 10. Установка PM2
sudo npm install -g pm2
pm2 start dist/server.js --name kodify-backend
pm2 save
pm2 startup

# Готово! Проверка:
pm2 status
curl http://localhost:3000/health
```

## Основные команды

```bash
# PM2
pm2 status                    # Статус
pm2 logs kodify-backend      # Логи
pm2 restart kodify-backend   # Перезапуск
pm2 stop kodify-backend      # Остановка

# Обновление
cd /var/www/it-company/backend
git pull                     # или загрузите новую версию
npm install
npm run build
pm2 restart kodify-backend
```

Полная инструкция в файле `DEPLOYMENT_GUIDE.md`