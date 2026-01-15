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

**Вариант A: Через SCP (с вашего Windows компьютера)**

На вашем компьютере (PowerShell):

```powershell
cd C:\Users\user\Desktop\it-company
scp -r backend root@89.111.142.190:~/projects/it-company/
```

**Вариант B: Через Git (если есть репозиторий)**

На сервере:

```bash
apt install git -y
cd ~/projects/it-company
git clone https://github.com/ваш-username/ваш-репозиторий.git .
cd backend
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
FRONTEND_URL=http://89.111.142.190:5173
FRONTEND_URLS=http://89.111.142.190:5173

DB_HOST=postgres
DB_PORT=5432
DB_NAME=kodify_db
DB_USER=kodify_user
DB_PASSWORD=сгенерируйте_сильный_пароль

UPLOAD_DIR=./uploads
PUBLIC_URL=http://89.111.142.190

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

