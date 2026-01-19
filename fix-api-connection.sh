#!/bin/bash

# Скрипт для исправления проблем с подключением к API
# Выполните на VPS: bash fix-api-connection.sh

set -e

echo "🔍 Диагностика проблем с API..."
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Проверка Nginx
echo "1. Проверка Nginx..."
if systemctl is-active --quiet nginx; then
    info "Nginx запущен"
else
    warn "Nginx не запущен. Запускаю..."
    systemctl start nginx
    systemctl enable nginx
    info "Nginx запущен"
fi

# 2. Проверка конфигурации Nginx
echo ""
echo "2. Проверка конфигурации Nginx..."

NGINX_CONF="/etc/nginx/sites-available/kodify-backend"
NGINX_ENABLED="/etc/nginx/sites-enabled/kodify-backend"

if [ ! -f "$NGINX_CONF" ]; then
    warn "Конфигурация Nginx не найдена. Создаю..."
    
    cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name api.kodifyweb.ru;

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
    info "Конфигурация создана"
else
    info "Конфигурация найдена"
fi

# Активировать конфигурацию
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
    info "Конфигурация активирована"
fi

# Проверка синтаксиса
if nginx -t 2>/dev/null; then
    info "Синтаксис конфигурации Nginx корректен"
    systemctl reload nginx
    info "Nginx перезагружен"
else
    error "Ошибка в конфигурации Nginx!"
    nginx -t
    exit 1
fi

# 3. Проверка бекенда
echo ""
echo "3. Проверка бекенда..."

cd ~/projects/kodify/backend 2>/dev/null || cd ~/projects/it-company/backend

if docker-compose ps | grep -q "kodify_backend.*Up"; then
    info "Бекенд запущен"
else
    warn "Бекенд не запущен. Запускаю..."
    docker-compose up -d
    sleep 5
    info "Бекенд запущен"
fi

# Проверка локального доступа
if curl -s http://localhost:3000/health > /dev/null; then
    info "Бекенд отвечает на порту 3000"
else
    error "Бекенд не отвечает на порту 3000!"
    echo "Проверьте логи: docker-compose logs backend"
    exit 1
fi

# 4. Проверка firewall
echo ""
echo "4. Проверка firewall..."

if command -v ufw > /dev/null; then
    UFW_STATUS=$(ufw status | grep -i "Status: active" || echo "")
    if [ -n "$UFW_STATUS" ]; then
        # Проверяем, открыты ли порты
        if ufw status | grep -q "80/tcp\|443/tcp"; then
            info "Порты 80 и 443 открыты"
        else
            warn "Порты 80/443 не открыты. Открываю..."
            ufw allow 80/tcp
            ufw allow 443/tcp
            ufw reload
            info "Порты открыты"
        fi
    else
        info "Firewall неактивен"
    fi
else
    warn "UFW не установлен. Проверьте iptables вручную"
fi

# 5. Проверка SSL сертификата
echo ""
echo "5. Проверка SSL сертификата..."

if command -v certbot > /dev/null; then
    CERT_EXISTS=$(certbot certificates 2>/dev/null | grep -c "api.kodifyweb.ru" || echo "0")
    if [ "$CERT_EXISTS" -gt 0 ]; then
        info "SSL сертификат для api.kodifyweb.ru найден"
    else
        warn "SSL сертификат не найден. Попытка получения..."
        if certbot --nginx -d api.kodifyweb.ru --non-interactive --agree-tos --redirect 2>/dev/null; then
            info "SSL сертификат получен и установлен"
        else
            error "Не удалось получить SSL сертификат"
            echo "Выполните вручную: certbot --nginx -d api.kodifyweb.ru"
        fi
    fi
else
    warn "Certbot не установлен. Установите: apt install certbot python3-certbot-nginx"
fi

# 6. Проверка переменных окружения бекенда
echo ""
echo "6. Проверка переменных окружения бекенда..."

if [ -f .env ]; then
    if grep -q "FRONTEND_URL=https://kodifyweb.ru" .env; then
        info "FRONTEND_URL настроен правильно"
    else
        warn "FRONTEND_URL не настроен. Добавляю..."
        if ! grep -q "FRONTEND_URL" .env; then
            echo "" >> .env
            echo "FRONTEND_URL=https://kodifyweb.ru" >> .env
        else
            sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://kodifyweb.ru|g' .env
        fi
    
        if ! grep -q "FRONTEND_URLS" .env; then
            echo "FRONTEND_URLS=https://kodifyweb.ru,https://www.kodifyweb.ru" >> .env
        else
            sed -i 's|FRONTEND_URLS=.*|FRONTEND_URLS=https://kodifyweb.ru,https://www.kodifyweb.ru|g' .env
        fi
        
        info "Переменные окружения обновлены"
        warn "Перезапустите бекенд: docker-compose restart backend"
    fi
else
    error "Файл .env не найден!"
    exit 1
fi

# 7. Финальная проверка
echo ""
echo "7. Финальная проверка..."

echo ""
echo "Проверка доступности API:"
if curl -s -k https://api.kodifyweb.ru/health > /dev/null; then
    info "API доступен по HTTPS: https://api.kodifyweb.ru/health"
elif curl -s http://api.kodifyweb.ru/health > /dev/null; then
    warn "API доступен только по HTTP (SSL не настроен)"
else
    error "API недоступен!"
    echo ""
    echo "Проверьте:"
    echo "  - Логи Nginx: tail -f /var/log/nginx/error.log"
    echo "  - Логи бекенда: docker-compose logs -f backend"
    echo "  - DNS: nslookup api.kodifyweb.ru"
fi

echo ""
echo "✅ Диагностика завершена!"
echo ""
echo "Если проблемы остались, проверьте:"
echo "  1. DNS записи: nslookup api.kodifyweb.ru"
echo "  2. Логи Nginx: tail -f /var/log/nginx/error.log"
echo "  3. Логи бекенда: docker-compose logs -f backend"
echo "  4. Перезапустите бекенд: docker-compose restart backend"
