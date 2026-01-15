# 📥 Загрузка бэкенда с GitHub на сервер

## 🎯 Ваш репозиторий

- **URL:** `https://github.com/Kirill1234756/kodify_backend.git`

## 🚀 Быстрая инструкция

### На сервере (через VNC терминал или SSH):

```bash
# 1. Установить Git (если не установлен)
apt install git -y

# 2. Создать директорию для проекта
mkdir -p ~/projects/it-company
cd ~/projects/it-company

# 3. Клонировать репозиторийcd
git clone https://github.com/Kirill1234756/kodify_backend.git backend

# 4. Перейти в директорию бэкенда
cd backend

# 5. Проверить, что файлы загружены
ls -la
```

## ✅ Проверка

После клонирования вы должны увидеть файлы:

- `Dockerfile`
- `docker-compose.yml`
- `package.json`
- `src/`
- и другие файлы проекта

## 🔄 Обновление кода (в будущем)

Если вы внесли изменения в GitHub и хотите обновить на сервере:

```bash
cd ~/projects/it-company/backend

# Получить последние изменения
git pull origin main

# Пересобрать и перезапустить контейнеры
docker compose down
docker compose build
docker compose up -d
```

## 🔐 Если репозиторий приватный

Если репозиторий приватный, вам нужно настроить доступ:

**Вариант 1: Использовать SSH ключ (рекомендуется)**

1. На сервере сгенерировать SSH ключ:

```bash
ssh-keygen -t ed25519 -C "server@kodify"
# Нажмите Enter для всех вопросов
cat ~/.ssh/id_ed25519.pub
```

2. Скопировать публичный ключ и добавить в GitHub:

   - Зайдите на GitHub → Settings → SSH and GPG keys
   - Нажмите "New SSH key"
   - Вставьте содержимое `~/.ssh/id_ed25519.pub`

3. Клонировать через SSH:

```bash
git clone git@github.com:Kirill1234756/kodify_backend.git backend
```

**Вариант 2: Использовать Personal Access Token**

1. На GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Создайте токен с правами `repo`
3. При клонировании используйте:

```bash
git clone https://YOUR_TOKEN@github.com/Kirill1234756/kodify_backend.git backend
```

## 📝 Следующие шаги

После клонирования репозитория:

1. Настройте `.env` файл:

```bash
cp ENV_EXAMPLE.txt .env
nano .env
```

2. Запустите Docker Compose:

```bash
docker compose build
docker compose up -d
```

См. `NEXT_STEPS.md` для полной инструкции.
