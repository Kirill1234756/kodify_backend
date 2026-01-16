# Конфигурация Nginx для Kodify Backend

## Быстрая установка

```bash
# 1. Скопировать файл конфигурации
sudo cp ~/projects/kodify/backend/nginx/kodify-backend.conf /etc/nginx/sites-available/kodify-backend

# 2. Если у вас есть домен, отредактируйте server_name:
sudo nano /etc/nginx/sites-available/kodify-backend
# Измените: server_name 89.111.142.190; на ваш домен

# 3. Активировать конфигурацию
sudo ln -s /etc/nginx/sites-available/kodify-backend /etc/nginx/sites-enabled/

# 4. Проверить конфигурацию
sudo nginx -t

# 5. Перезагрузить Nginx
sudo systemctl reload nginx
```

## Если нужно использовать домен вместо IP

Отредактируйте файл и замените:
```nginx
server_name 89.111.142.190;
```
на:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

## Настройка SSL (HTTPS)

После настройки HTTP, установите SSL сертификат:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot автоматически обновит конфигурацию Nginx для HTTPS.

