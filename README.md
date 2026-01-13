# IT Company Backend API

Backend API для IT компании с интеграцией Supabase, email уведомлениями, Telegram ботом и Bitrix24.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните все переменные:

```bash
cp .env.example .env
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

Сервер будет доступен по адресу: `http://localhost:3000`

## 📋 API Endpoints

### Client Form (Детальная форма)

- `POST /api/client-form` - Отправка детальной формы клиента
- `GET /api/client-form/:id` - Получение заявки по ID
- `GET /api/client-form` - Получение всех заявок с пагинацией
- `PUT /api/client-form/:id/status` - Обновление статуса заявки

### Contact Form (Контактная форма)

- `POST /api/contact-form` - Отправка контактной формы
- `GET /api/contact-form/:id` - Получение заявки по ID
- `GET /api/contact-form` - Получение всех заявок с пагинацией
- `PUT /api/contact-form/:id/status` - Обновление статуса заявки

### Test Endpoints

- `GET /api/test/email` - Тест email конфигурации
- `GET /api/test/telegram` - Тест Telegram бота
- `GET /api/test/bitrix` - Тест Bitrix24 подключения
- `GET /health` - Проверка состояния сервера

## 🔧 Конфигурация

### Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Получите URL и API ключи
3. Создайте таблицы согласно схеме в `SUPABASE_SETUP.md`
4. Настройте Storage для файлов

### Email (SMTP)

Настройте SMTP для отправки уведомлений:

- Gmail: используйте App Password
- Mail.ru: настройте SMTP
- Yandex: настройте SMTP

### Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Создайте группу для уведомлений
4. Добавьте бота в группу и получите chat_id

### Bitrix24

Настройте интеграцию с Bitrix24:

1. Получите webhook URL или настройте REST API
2. Настройте поля соответствия
3. Протестируйте подключение

## 📁 Структура проекта

```
backend/
├── src/
│   ├── config/          # Конфигурационные файлы
│   ├── services/        # Сервисы (Supabase, Email, Telegram, Bitrix)
│   ├── routes/          # API роуты
│   ├── middleware/      # Middleware (валидация, rate limiting)
│   └── server.ts        # Главный файл сервера
├── .env.example         # Пример переменных окружения
├── .env                 # Переменные окружения
├── package.json
└── tsconfig.json
```

## 🛠 Скрипты

- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Сборка проекта
- `npm start` - Запуск production версии
- `npm test` - Запуск тестов

## 🔒 Безопасность

- Rate limiting (5 запросов в минуту)
- Валидация всех входных данных
- Санитизация данных
- CORS настройка
- Helmet для безопасности заголовков

## 📊 Мониторинг

- Логирование всех запросов
- Метрики производительности
- Health check endpoint
- Тестирование сервисов при запуске

## 🚀 Деплой

### Heroku

1. Создайте приложение на Heroku
2. Настройте переменные окружения
3. Подключите GitHub репозиторий
4. Включите автоматический деплой

### Railway

1. Подключите GitHub репозиторий
2. Настройте переменные окружения
3. Railway автоматически соберет и запустит приложение

### DigitalOcean

1. Создайте Droplet
2. Установите Node.js
3. Клонируйте репозиторий
4. Настройте PM2 для управления процессами

## 📝 Логи

Логи сохраняются в консоль. Для production рекомендуется настроить:

- Winston для структурированных логов
- Sentry для отслеживания ошибок
- ELK Stack для анализа логов

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Убедитесь, что все переменные окружения настроены
3. Протестируйте подключения к внешним сервисам
4. Проверьте документацию по настройке сервисов







