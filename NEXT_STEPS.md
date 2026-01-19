# 🎯 Что делать дальше после входа на сервер

## ✅ Вы уже сделали:

- ✅ Подключились к серверу через VNC
- ✅ Вошли как `root`

## 📋 Следующие шаги (по порядку):

### Шаг 1: Обновить систему

В терминале выполните:

```bash
apt update && apt upgrade -y
```

Это обновит список пакетов и установит обновления безопасности.

---

### Шаг 2: Проверить Docker

Docker должен быть уже установлен (из письма: "Docker with Portainer frontend"). Проверьте:

```bash
docker --version
docker compose version
```

**Если Docker Compose не установлен:**

```bash
apt install docker-compose-plugin -y
```

**Если Docker не работает:**

```bash
systemctl start docker
systemctl enable docker
systemctl status docker
```

---

### Шаг 3: Подготовить директорию для проекта

```bash
mkdir -p ~/projects/it-company
cd ~/projects/it-company
```

---

### Шаг 4: Загрузить проект на сервер

**Вариант A: Через Git (рекомендуется) - ваш репозиторий**

На сервере (в VNC терминале):

```bash
# Установить Git (если еще не установлен)
apt install git -y

# Перейти в директорию проектов
cd ~/projects/it-company

# Клонировать ваш репозиторий
git clone https://github.com/Kirill1234756/kodify_backend.git backend

# Перейти в директорию бэкенда
cd backend
```

**Вариант B: Через SCP (альтернативный способ)**

Если Git не работает, на вашем компьютере (PowerShell):

```powershell
cd C:\Users\user\Desktop\it-company
# Замените 89.111.142.190 на ваш IP адрес сервера
scp -r backend root@ваш_IP_адрес:~/projects/it-company/
```

**Вариант C: Загрузка через веб-интерфейс или архив**

Создайте архив на локальном ПК и загрузите через SCP или через панель управления.

---

### Шаг 5: Настроить переменные окружения

```bash
cd ~/projects/it-company/backend

# Создать .env файл из примера
cp ENV_EXAMPLE.txt .env

# Отредактировать .env файл
nano .env
```

**Минимальные настройки для .env:**

```env
NODE_ENV=production
PORT=3000

# Frontend URL (основной домен фронтенда)
FRONTEND_URL=https://kodifyweb.ru
FRONTEND_URLS=https://kodifyweb.ru,http://kodifyweb.ru

# Database (используется имя сервиса из docker-compose)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=kodify_db
DB_USER=kodify_user
DB_PASSWORD=сгенерируйте_сильный_пароль

# File Storage (URL для доступа к загруженным файлам)
UPLOAD_DIR=./uploads
PUBLIC_URL=https://api.kodifyweb.ru

# Генерируйте пароль БД командой:
# openssl rand -base64 32
```

**Сохраните файл:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

### Шаг 6: Запустить Docker Compose

```bash
cd ~/projects/it-company/backend

# Собрать образы
docker compose build

# Запустить контейнеры
docker compose up -d

# Проверить статус
docker compose ps

# Посмотреть логи
docker compose logs -f
```

---

### Шаг 7: Проверить работу

```bash
# Health check
curl http://localhost:3000/health

# Логи бэкенда
docker compose logs backend

# Логи базы данных
docker compose logs postgres
```

---

## 🔧 Если что-то пошло не так:

**Ошибка при сборке:**

```bash
docker compose logs
# Проверьте логи и исправьте ошибки
```

**Контейнеры не запускаются:**

```bash
docker compose down
docker compose up -d
docker compose logs -f
```

**Проблемы с базой данных:**

```bash
docker compose exec postgres psql -U kodify_user -d kodify_db
```

---

## 📚 Полная документация

См. `DEPLOY_UBUNTU.md` для детальной инструкции со всеми опциями.
