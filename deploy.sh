#!/bin/bash
#
# Скрипт для автоматического развертывания бэкенда на Ubuntu сервере
# Использование: ./deploy.sh
#

set -e  # Остановка при ошибке

echo "🚀 Начало развертывания Kodify Backend..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функции для вывода
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен. Установите Docker перед продолжением."
fi

# Проверка наличия Docker Compose
if ! command -v docker compose &> /dev/null; then
    error "Docker Compose не установлен. Установите Docker Compose перед продолжением."
fi

# Проверка наличия .env файла
if [ ! -f .env ]; then
    warn ".env файл не найден. Создаю из примера..."
    if [ -f ENV_EXAMPLE.txt ]; then
        cp ENV_EXAMPLE.txt .env
        warn "Пожалуйста, отредактируйте .env файл перед запуском!"
        exit 1
    else
        error ".env файл не найден и ENV_EXAMPLE.txt тоже отсутствует."
    fi
fi

info "Проверка .env файла..."
if ! grep -q "DB_PASSWORD" .env || ! grep -q "FRONTEND_URL" .env; then
    warn ".env файл не настроен полностью. Пожалуйста, настройте все необходимые переменные."
fi

# Создание директории для uploads, если её нет
if [ ! -d "uploads" ]; then
    info "Создание директории uploads..."
    mkdir -p uploads
    chmod 755 uploads
fi

# Сборка образов
info "Сборка Docker образов..."
docker compose build

# Остановка существующих контейнеров (если есть)
info "Остановка существующих контейнеров..."
docker compose down || true

# Запуск контейнеров
info "Запуск контейнеров..."
docker compose up -d

# Ожидание запуска
info "Ожидание запуска сервисов..."
sleep 10

# Проверка статуса
info "Проверка статуса контейнеров..."
docker compose ps

# Проверка health check
info "Проверка health check бэкенда..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        info "✅ Бэкенд успешно запущен и работает!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            error "❌ Бэкенд не отвечает на health check. Проверьте логи: docker compose logs backend"
        fi
        warn "Ожидание запуска бэкенда... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    fi
done

# Показываем логи
info "Последние строки логов бэкенда:"
docker compose logs --tail=20 backend

info "✅ Развертывание завершено успешно!"
info "Для просмотра логов используйте: docker compose logs -f"
info "Для остановки используйте: docker compose down"


