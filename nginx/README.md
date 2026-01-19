# Конфигурация Nginx для Kodify Backend

## Быстрая установка

```bash
# 1. Скопировать файл конфигурации
sudo cp ~/projects/kodify/backend/nginx/kodify-backend.conf /etc/nginx/sites-available/kodify-backend

# 2. Если у вас есть домен, отредактируйте server_name:
sudo nano /etc/nginx/sites-available/kodify-backend
# Файл уже настроен с server_name api.kodifyweb.ru;
# Если нужен другой домен, измените на ваш домен

# 3. Активировать конфигурацию
sudo ln -s /etc/nginx/sites-available/kodify-backend /etc/nginx/sites-enabled/

# 4. Проверить конфигурацию
sudo nginx -t

# 5. Перезагрузить Nginx
sudo systemctl reload nginx
```

## Если нужно использовать домен вместо IP

Файл уже настроен для этого проекта:
```nginx
server_name api.kodifyweb.ru;
```

Для другого проекта измените на ваш домен:
```nginx
server_name api.yourdomain.com;
# или
server_name yourdomain.com www.yourdomain.com;
```

## Настройка SSL (HTTPS)

После настройки HTTP, установите SSL сертификат:

```bash
sudo apt install certbot python3-certbot-nginx -y

# Для этого проекта (API поддомен):
sudo certbot --nginx -d api.kodifyweb.ru

# Или для основного домена:
# sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot автоматически обновит конфигурацию Nginx для HTTPS.
