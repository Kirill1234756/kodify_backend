# IT Company Backend API

Полнофункциональный Backend API для IT компании с поддержкой форм обратной связи, загрузки файлов, интеграцией с PostgreSQL, email уведомлениями, Telegram ботом и Bitrix24.

## 📋 Содержание

- [Быстрый старт](#-быстрый-старт)
- [Архитектура](#-архитектура)
- [API Endpoints](#-api-endpoints)
- [Конфигурация](#-конфигурация)
- [Сервисы](#-сервисы)
- [Развертывание](#-развертывание)
- [Бекапы](#-бекапы)
- [Безопасность](#-безопасность)
- [Устранение неполадок](#-устранение-неполадок)

---

## 🚀 Быстрый старт

### Локальная разработка

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd it-company/backend

# 2. Установить зависимости
npm install

# 3. Настроить переменные окружения
cp .env.example .env
# Отредактируйте .env и заполните все необходимые переменные

# 4. Запустить PostgreSQL (Docker)
docker-compose up -d postgres

# 5. Применить миграции базы данных
# Миграции применяются автоматически при первом запуске PostgreSQL

# 6. Запустить сервер в режиме разработки
npm run dev

# Сервер будет доступен на http://localhost:3000
```

### Production с Docker Compose

```bash
# 1. Настроить .env файл с production переменными
cp .env.example .env
# Заполните все переменные окружения

# 2. Собрать и запустить все сервисы
docker-compose up -d --build

# 3. Проверить статус
docker-compose ps

# 4. Просмотреть логи
docker-compose logs -f backend
```

---

## 🏗 Архитектура

### Структура проекта

```
backend/
├── src/
│   ├── config/              # Конфигурационные файлы
│   │   ├── database.ts      # PostgreSQL настройки
│   │   ├── email.ts         # SMTP конфигурация
│   │   ├── telegram.ts      # Telegram Bot настройки
│   │   └── bitrix.ts        # Bitrix24 конфигурация
│   │
│   ├── services/            # Бизнес-логика
│   │   ├── databaseService.ts    # Работа с БД (CRUD операции)
│   │   ├── emailService.ts       # Отправка email
│   │   ├── telegramService.ts    # Telegram уведомления
│   │   ├── bitrixService.ts      # Интеграция с Bitrix24
│   │   └── fileStorageService.ts # Работа с файлами
│   │
│   ├── routes/              # API маршруты
│   │   ├── clientForm.routes.ts   # Детальная форма клиента
│   │   ├── contactForm.routes.ts  # Контактная форма
│   │   └── calculator.routes.ts   # Форма калькулятора
│   │
│   ├── middleware/          # Промежуточное ПО
│   │   ├── validation.ts    # Валидация данных (Joi)
│   │   ├── fileUpload.ts    # Загрузка файлов (Multer)
│   │   └── rateLimit.ts     # Ограничение запросов
│   │
│   ├── utils/               # Утилиты
│   │   ├── logger.ts        # Логирование
│   │   ├── errors.ts        # Обработка ошибок
│   │   └── env.ts           # Валидация переменных окружения
│   │
│   └── server.ts            # Главный файл сервера
│
├── sql/
│   └── migrations/          # SQL миграции
│       └── 001_create_tables.sql
│
├── nginx/                   # Конфигурация Nginx
│   └── kodify-backend.conf
│
├── scripts/                 # Вспомогательные скрипты
│   └── init-database.ts
│
├── docker-compose.yml       # Docker Compose конфигурация
├── Dockerfile               # Docker образ
├── backup.sh               # Скрипт создания бекапов
├── restore.sh              # Скрипт восстановления
├── package.json
└── tsconfig.json
```

### Технологический стек

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: pg (native PostgreSQL driver)
- **File Upload**: Multer
- **Validation**: Joi
- **Email**: Nodemailer
- **Telegram**: node-telegram-bot-api
- **CRM**: Bitrix24 REST API
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx

---

## 📡 API Endpoints

### Client Form (Детальная форма клиента)

#### `POST /api/client-form`
Отправка детальной формы клиента с возможностью прикрепления файла.

**Параметры запроса:**
```json
{
  "name": "Иван Иванов",
  "company": "ООО Пример",
  "email": "ivan@example.com",
  "phone": "+79991234567",
  "budget": "500000-1000000",
  "companyDescription": "Описание компании",
  "task": "Описание задачи",
  "solutionVision": "Видение решения",
  "expectations": "Ожидания от проекта"
}
```

**Файл (multipart/form-data):**
- Поле: `attachedFile`
- Максимальный размер: 10MB
- Разрешенные типы: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG

**Ответ:**
```json
{
  "success": true,
  "message": "Заявка успешно отправлена",
  "data": {
    "id": "uuid",
    "name": "Иван Иванов",
    "status": "new",
    "created_at": "2026-01-21T12:00:00Z"
  }
}
```

#### `GET /api/client-form/:id`
Получение заявки по ID.

#### `GET /api/client-form?page=1&limit=10&status=new`
Получение всех заявок с пагинацией и фильтрацией по статусу.

**Query параметры:**
- `page` (number): Номер страницы (по умолчанию: 1)
- `limit` (number): Количество записей на странице (по умолчанию: 10)
- `status` (string, опционально): Фильтр по статусу (new, in_progress, completed, rejected)

#### `PUT /api/client-form/:id/status`
Обновление статуса заявки.

**Тело запроса:**
```json
{
  "status": "in_progress"
}
```

---

### Contact Form (Контактная форма)

#### `POST /api/contact-form`
Отправка контактной формы (упрощенная форма).

**Параметры запроса:**
```json
{
  "name": "Петр Петров",
  "email": "petr@example.com",
  "phone": "+79991234567"
}
```

**Ответ:** Аналогичен Client Form

#### `GET /api/contact-form/:id`
Получение заявки по ID.

#### `GET /api/contact-form?page=1&limit=10`
Получение всех заявок с пагинацией.

#### `PUT /api/contact-form/:id/status`
Обновление статуса заявки.

---

### Calculator Form (Форма калькулятора)

#### `POST /api/calculator-form`
Отправка формы из калькулятора стоимости сайта.

**Параметры запроса:**
```json
{
  "name": "Сергей Сергеев",
  "email": "sergey@example.com",
  "phone": "+79991234567",
  "siteType": "landing",
  "pages": 5,
  "design": "standard",
  "features": ["catalog", "cart"],
  "content": "partial",
  "seo": true,
  "ads": false,
  "urgency": "normal",
  "support": "basic"
}
```

**Ответ:** Аналогичен другим формам

---

### Health Check & Test Endpoints

#### `GET /health`
Проверка состояния сервера.

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T12:00:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

#### `GET /api/test/telegram` (Production доступен)
Тест подключения к Telegram боту.

**Ответ:**
```json
{
  "success": true,
  "message": "Telegram bot is working"
}
```

#### `GET /api/test/email` (только Development)
Тест отправки email.

#### `GET /api/test/bitrix` (только Development)
Тест подключения к Bitrix24.

#### `GET /api/test/database` (только Development)
Тест подключения к базе данных.

---

## ⚙️ Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# ============================================
# Server Configuration
# ============================================
NODE_ENV=production
PORT=3000

# ============================================
# Frontend Configuration
# ============================================
FRONTEND_URL=https://kodifyweb.ru
FRONTEND_URLS=https://kodifyweb.ru,https://www.kodifyweb.ru

# ============================================
# Database Configuration (PostgreSQL)
# ============================================
DB_HOST=postgres
DB_PORT=5432
DB_NAME=kodify_db
DB_USER=kodify_user
DB_PASSWORD=your_secure_password_here

# ============================================
# File Storage Configuration
# ============================================
UPLOAD_DIR=./uploads
PUBLIC_URL=https://api.kodifyweb.ru

# ============================================
# Email Configuration (SMTP) - Опционально
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=admin@kodifyweb.ru

# ============================================
# Telegram Bot Configuration - Опционально
# ============================================
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# ============================================
# Bitrix24 Configuration - Опционально
# ============================================
# Используйте webhook метод (рекомендуется)
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_token/

# Или используйте REST API метод
# BITRIX24_DOMAIN=your-domain.bitrix24.ru
# BITRIX24_USER_ID=1
# BITRIX24_AUTH_TOKEN=your_auth_token
```

### Описание переменных

#### Обязательные переменные

- `NODE_ENV`: Режим работы (`development` | `production`)
- `PORT`: Порт сервера (по умолчанию: 3000)
- `FRONTEND_URL`: Основной URL фронтенда (для CORS)
- `DB_HOST`: Хост PostgreSQL (в Docker: `postgres`)
- `DB_NAME`: Имя базы данных
- `DB_USER`: Пользователь PostgreSQL
- `DB_PASSWORD`: Пароль PostgreSQL
- `PUBLIC_URL`: Публичный URL API (для ссылок на файлы)

#### Опциональные переменные

- `FRONTEND_URLS`: Список разрешенных доменов через запятую
- `SMTP_*`: Настройки SMTP для email (если не настроено, email будет опционален)
- `TELEGRAM_*`: Настройки Telegram бота (если не настроено, уведомления не будут отправляться)
- `BITRIX24_*`: Настройки Bitrix24 (если не настроено, лиды не будут создаваться в CRM)

---

## 🔧 Сервисы

### DatabaseService

Управление данными в PostgreSQL.

**Методы:**
- `saveClientForm(data)`: Сохранение детальной формы
- `saveContactForm(data)`: Сохранение контактной формы
- `saveCalculatorForm(data)`: Сохранение формы калькулятора
- `getForms(table, page, limit, status)`: Получение форм с пагинацией
- `getFormById(table, id)`: Получение формы по ID
- `updateFormStatus(table, id, status)`: Обновление статуса
- `testConnection()`: Проверка подключения

### EmailService

Отправка email уведомлений через SMTP.

**Методы:**
- `sendClientFormNotification(formData, formRecord)`: Уведомление о детальной форме
- `sendContactFormNotification(formData, formRecord)`: Уведомление о контактной форме
- `sendCalculatorFormNotification(formData, formRecord)`: Уведомление о калькуляторе
- `testEmailConfiguration()`: Тест конфигурации

**Особенности:**
- Опционален в production (если не настроен, система не падает)
- Поддержка HTML шаблонов
- Логирование ошибок без прерывания работы

### TelegramService

Отправка уведомлений в Telegram.

**Методы:**
- `sendClientFormNotification(formData, formRecord)`: Уведомление о детальной форме
- `sendContactFormNotification(formData, formRecord)`: Уведомление о контактной форме
- `sendCalculatorFormNotification(formData, formRecord)`: Уведомление о калькуляторе
- `sendMessage(message)`: Отправка произвольного сообщения
- `sendFile(filePath, caption)`: Отправка файла
- `testBotConfiguration()`: Тест конфигурации бота
- `getBotInfo()`: Получение информации о боте

**Особенности:**
- Опционален в production
- Красивое форматирование сообщений с эмодзи
- Поддержка отправки файлов

### BitrixService

Интеграция с Bitrix24 CRM.

**Методы:**
- `createLead(leadData)`: Создание лида в Bitrix24
- `createClientFormLead(formData)`: Создание лида из детальной формы
- `createContactFormLead(formData)`: Создание лида из контактной формы
- `createCalculatorFormLead(formData)`: Создание лида из калькулятора
- `testConnection()`: Тест подключения

**Особенности:**
- Поддержка webhook и REST API методов
- Автоматическое сопоставление полей форм с полями Bitrix24
- Опционален в production

### FileStorageService

Управление загруженными файлами.

**Методы:**
- `saveFile(file, formId)`: Сохранение файла
- `getFileUrl(fileName)`: Получение URL файла
- `deleteFile(fileName)`: Удаление файла

**Особенности:**
- Локальное хранение в `./uploads`
- Валидация типов и размера файлов
- Генерация уникальных имен файлов

---

## 🚀 Развертывание

### Production развертывание на Ubuntu VPS

Подробная инструкция доступна в [DEPLOY_UBUNTU.md](./DEPLOY_UBUNTU.md).

**Краткий план:**

1. Подготовка сервера (Ubuntu 20.04+)
2. Установка Docker и Docker Compose
3. Настройка Nginx как reverse proxy
4. Получение SSL сертификата (Let's Encrypt)
5. Клонирование репозитория
6. Настройка `.env` файла
7. Запуск через Docker Compose

### Docker Compose

```bash
# Сборка и запуск
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f backend

# Перезапуск сервиса
docker-compose restart backend

# Остановка
docker-compose down

# Остановка с удалением volumes (ОСТОРОЖНО!)
docker-compose down -v
```

### Nginx конфигурация

Пример конфигурации Nginx для reverse proxy доступен в `nginx/kodify-backend.conf`.

**Основные настройки:**
- HTTPS с автоматическим редиректом HTTP → HTTPS
- SSL сертификаты от Let's Encrypt
- Проксирование запросов на backend:3000
- Отдача статических файлов из `/uploads`
- Безопасные заголовки

---

## 💾 Бекапы

### Автоматические бекапы

Система бекапов включена. Скрипты:
- `backup.sh`: Создание бекапа базы данных и файлов
- `restore.sh`: Восстановление из бекапа

**Что бекапится:**
- PostgreSQL база данных (полный SQL дамп)
- Загруженные файлы (`./uploads`)

**Настройка автоматических бекапов:**

```bash
# Редактировать crontab
crontab -e

# Добавить строку для ежедневных бекапов в 2:00
0 2 * * * cd /root/projects/kodify/backend && ./backup.sh >> /var/log/kodify-backup.log 2>&1
```

**Создание бекапа вручную:**

```bash
cd ~/projects/kodify/backend
./backup.sh
```

**Восстановление:**

```bash
./restore.sh
# Следуйте инструкциям для выбора бекапа
```

**Локация бекапов:** `./backups/`

**Очистка:** Старые бекапы (старше 30 дней) удаляются автоматически.

---

## 🔒 Безопасность

### Реализованные меры безопасности

1. **Rate Limiting**: 5 запросов в минуту с одного IP
2. **Валидация данных**: Joi схемы для всех входных данных
3. **Санитизация**: Очистка пользовательского ввода от XSS
4. **CORS**: Строгий контроль разрешенных источников
5. **Helmet**: Безопасные HTTP заголовки
6. **Antibot Guard**: Базовая защита от ботов
7. **File Upload Validation**: Проверка типа и размера файлов
8. **SQL Injection Protection**: Параметризованные запросы
9. **HTTPS**: Принудительное использование SSL/TLS в production

### Рекомендации по безопасности

- Используйте сильные пароли для БД (`openssl rand -base64 32`)
- Регулярно обновляйте зависимости (`npm audit`)
- Храните `.env` файл в безопасности (права доступа: 600)
- Используйте firewall (UFW) на сервере
- Регулярно создавайте бекапы
- Мониторьте логи на подозрительную активность

---

## 🛠 Устранение неполадок

### Частые проблемы

#### База данных не подключается

```bash
# Проверить статус PostgreSQL контейнера
docker-compose ps postgres

# Проверить логи
docker-compose logs postgres

# Проверить переменные окружения
docker-compose exec backend env | grep DB_
```

#### Telegram бот не работает

```bash
# Проверить токен
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"

# Проверить endpoint
curl https://api.kodifyweb.ru/api/test/telegram

# Проверить логи
docker-compose logs backend | grep -i telegram
```

#### Email не отправляется

- Проверьте SMTP настройки в `.env`
- Для Gmail используйте App Password, не обычный пароль
- Проверьте логи: `docker-compose logs backend | grep -i email`

#### Файлы не загружаются

- Проверьте права на директорию `uploads/`: `chmod 755 uploads`
- Проверьте переменную `PUBLIC_URL` в `.env`
- Убедитесь что volume смонтирован в docker-compose.yml

#### CORS ошибки

- Проверьте `FRONTEND_URL` и `FRONTEND_URLS` в `.env`
- Убедитесь что фронтенд отправляет запросы с правильного домена
- В development режиме CORS более либеральный

### Логи

```bash
# Все логи
docker-compose logs -f

# Логи только backend
docker-compose logs -f backend

# Последние 100 строк
docker-compose logs --tail=100 backend

# Логи с фильтром
docker-compose logs backend | grep ERROR
```

### Health Check

```bash
# Проверка состояния сервера
curl http://localhost:3000/health

# Или в production
curl https://api.kodifyweb.ru/health
```

---

## 📝 Дополнительная документация

- [DEPLOY_UBUNTU.md](./DEPLOY_UBUNTU.md) - Подробная инструкция по развертыванию на Ubuntu
- [BITRIX24_SETUP.md](./BITRIX24_SETUP.md) - Настройка интеграции с Bitrix24
- [nginx/kodify-backend.conf](./nginx/kodify-backend.conf) - Конфигурация Nginx

---

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Убедитесь что все переменные окружения настроены правильно
3. Протестируйте подключения к внешним сервисам (Telegram, Email, Bitrix24)
4. Проверьте статус контейнеров: `docker-compose ps`
5. Проверьте health check: `curl /health`

---

## 📄 Лицензия

Этот проект создан для внутреннего использования IT компании.

---

**Версия:** 1.0.0  
**Последнее обновление:** Январь 2026
