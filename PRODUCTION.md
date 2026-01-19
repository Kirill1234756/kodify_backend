# Production Deployment Guide

Этот документ описывает изменения, внесенные для подготовки к production, и рекомендации по развертыванию.

## Изменения для Production

### 1. Система логирования

- Создан модуль `src/utils/logger.ts` для централизованного логирования
- В development: логируются все уровни (debug, info, warn, error)
- В production: логируются только warn и error
- В test: логирование отключено

### 2. Валидация переменных окружения

- Создан модуль `src/utils/env.ts` для валидации переменных окружения
- В production: строгая валидация обязательных переменных
- В development: более мягкая валидация с предупреждениями

### 3. Обработка ошибок

- Создан модуль `src/utils/errors.ts` с кастомными классами ошибок
- Улучшена обработка ошибок в глобальном обработчике
- В production: не возвращаются stack traces в ответах

### 4. Rate Limiting

- Включен rate limiting в production (можно отключить через `DISABLE_RATE_LIMIT=true`)
- Общие лимиты: 100 запросов за 15 минут
- Лимиты для форм: 10 запросов за минуту
- Используется in-memory store (для production с Redis рекомендуется использовать `express-rate-limit`)

### 5. Безопасность

- Тестовые эндпоинты (`/api/test/*`) скрыты в production
- CSP (Content Security Policy) включен в production
- Graceful shutdown для корректного завершения работы
- Обработка unhandled rejections и uncaught exceptions

### 6. Конфигурация

- Разделение логики для development и production
- Оптимизирована конфигурация Helmet для production
- Улучшен graceful shutdown для закрытия соединений

## Переменные окружения для Production

### Обязательные переменные

```env
# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
# или несколько URL через запятую:
FRONTEND_URLS=https://yourdomain.com,https://www.yourdomain.com

# Database (обязательно)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_secure_password

# File Storage
PUBLIC_URL=https://yourdomain.com
UPLOAD_DIR=./uploads
```

### Опциональные переменные (если используются сервисы)

```env
# Email (если используется)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=admin@yourdomain.com

# Telegram (если используется)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Bitrix24 (если используется)
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_token/
```

### Дополнительные настройки

```env
# Отключить rate limiting (не рекомендуется в production)
DISABLE_RATE_LIMIT=false
```

## Запуск в Production

### 1. Сборка проекта

```bash
npm run build
```

### 2. Проверка переменных окружения

Убедитесь, что все обязательные переменные заданы в `.env` файле или через переменные окружения системы.

### 3. Запуск

```bash
npm start
```

Или через PM2 (рекомендуется):

```bash
npm install -g pm2
pm2 start dist/server.js --name backend
pm2 save
pm2 startup
```

### 4. Docker (рекомендуется)

Используйте `docker-compose.yml` для развертывания:

```bash
docker-compose up -d
```

## Рекомендации для Production

### 1. Reverse Proxy

Используйте Nginx или другой reverse proxy перед приложением:

- SSL/TLS терминация
- Сжатие ответов
- Кеширование статических файлов
- Rate limiting на уровне Nginx

### 2. Мониторинг

- Настройте мониторинг логов (например, через PM2 logs или ELK stack)
- Настройте мониторинг здоровья через `/health` endpoint
- Используйте сервисы мониторинга (Prometheus, Grafana, etc.)

### 3. Резервное копирование

- Настройте автоматическое резервное копирование базы данных
- Регулярно делайте бэкапы папки `uploads/`

### 4. Безопасность

- Используйте сильные пароли для всех сервисов
- Регулярно обновляйте зависимости (`npm audit`, `npm update`)
- Используйте HTTPS везде
- Настройте файрвол для ограничения доступа к базе данных

### 5. Производительность

- Рассмотрите использование Redis для rate limiting
- Настройте connection pooling для базы данных
- Используйте CDN для статических файлов
- Настройте кеширование там, где это возможно

### 6. Логирование

- Настройте ротацию логов
- Используйте структурированное логирование (можно расширить `logger.ts`)
- Настройте централизованное хранение логов

## Запуск локально (Development)

Проект сохраняет возможность запуска локально в development режиме:

```bash
# Установка зависимостей
npm install

# Настройка .env файла (скопируйте из ENV_EXAMPLE.txt)
# Отредактируйте .env с вашими локальными настройками

# Запуск в development режиме
npm run dev
```

В development режиме:

- Тестовые эндпоинты доступны
- Логирование более подробное
- Rate limiting отключен (если не задан `DISABLE_RATE_LIMIT=false`)
- CSP отключен для удобства разработки

## Проверка готовности к Production

Перед деплоем убедитесь:

- [ ] Все обязательные переменные окружения заданы
- [ ] `NODE_ENV=production` установлен
- [ ] Проект успешно собирается (`npm run build`)
- [ ] Все тесты проходят (если есть)
- [ ] Health check endpoint работает (`/health`)
- [ ] База данных доступна и инициализирована
- [ ] Файлы в `uploads/` доступны и имеют правильные права
- [ ] Rate limiting работает
- [ ] Graceful shutdown работает корректно
- [ ] Логи пишутся в правильное место
- [ ] Мониторинг настроен

## Troubleshooting

### Проблема: Приложение не запускается

- Проверьте переменные окружения
- Проверьте логи на наличие ошибок
- Убедитесь, что порт не занят

### Проблема: Rate limiting слишком строгий

- Установите `DISABLE_RATE_LIMIT=true` для тестирования
- Или настройте лимиты в `src/middleware/rateLimit.ts`

### Проблема: Тестовые эндпоинты недоступны

- В production они скрыты по соображениям безопасности
- Используйте их только в development режиме

### Проблема: Ошибки в логах не видны

- В production логируются только warn и error
- Проверьте уровень логирования в `src/utils/logger.ts`

