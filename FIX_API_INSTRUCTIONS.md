# 🔧 Исправление ошибки подключения к API

## Проблема

Фронтенд не может подключиться к API. Ошибка: "Ошибка подключения к серверу"

## Быстрое исправление

### Шаг 1: Выполните скрипт на VPS

**Подключитесь к VPS:**
```bash
ssh root@89.111.142.190
```

**Перейдите в папку бекенда:**
```bash
cd ~/projects/kodify/backend
# или
cd ~/projects/it-company/backend
```

**Скачайте или создайте скрипт исправления:**
```bash
# Если скрипт уже есть в репозитории
git pull

# Или создайте файл вручную
nano fix-api-connection.sh
# (скопируйте содержимое из файла fix-api-connection.sh)
```

**Выполните скрипт:**
```bash
chmod +x fix-api-connection.sh
bash fix-api-connection.sh
```

---

## Ручное исправление (если скрипт не работает)

### 1. Проверка и запуск Nginx

```bash
# Проверить статус
systemctl status nginx

# Если не запущен - запустить
systemctl start nginx
systemctl enable nginx
```

### 2. Создание конфигурации Nginx

```bash
nano /etc/nginx/sites-available/kodify-backend
```

**Вставьте:**
```nginx
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
    }
}
```

**Активируйте:**
```bash
ln -sf /etc/nginx/sites-available/kodify-backend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3. Установка SSL сертификата

```bash
# Установить Certbot (если не установлен)
apt update
apt install -y certbot python3-certbot-nginx

# Получить сертификат
certbot --nginx -d api.kodifyweb.ru --redirect
```

### 4. Обновление переменных окружения бекенда

```bash
cd ~/projects/kodify/backend
# или
cd ~/projects/it-company/backend

nano .env
```

**Убедитесь, что есть:**
```env
NODE_ENV=production
FRONTEND_URL=https://kodifyweb.ru
FRONTEND_URLS=https://kodifyweb.ru,https://www.kodifyweb.ru
PUBLIC_URL=https://api.kodifyweb.ru
```

**Перезапустите бекенд:**
```bash
docker-compose restart backend
```

### 5. Проверка firewall

```bash
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

### 6. Проверка бекенда

```bash
# Проверить статус
docker-compose ps

# Проверить логи
docker-compose logs backend --tail=50

# Проверить локальный доступ
curl http://localhost:3000/health
```

---

## Проверка после исправления

**На вашем компьютере:**

```bash
# Проверить DNS
nslookup api.kodifyweb.ru

# Проверить доступность
curl https://api.kodifyweb.ru/health
```

**В браузере:**
- Откройте: `https://api.kodifyweb.ru/health`
- Должен вернуться JSON с `"success": true`

**На сайте:**
- Откройте: `https://kodifyweb.ru/contacts`
- Попробуйте отправить форму
- Ошибка должна исчезнуть

---

## Если проблема осталась

### Проверьте логи

**На VPS:**
```bash
# Логи Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Логи бекенда
cd ~/projects/kodify/backend
docker-compose logs -f backend
```

### Проверьте DNS

```bash
nslookup api.kodifyweb.ru
ping api.kodifyweb.ru
```

Должно показывать IP: `89.111.142.190`

### Проверьте порты

```bash
netstat -tlnp | grep :80
netstat -tlnp | grep :443
netstat -tlnp | grep :3000
```

---

## Возможные причины

1. **Nginx не запущен** - самый частый случай
2. **Конфигурация Nginx отсутствует или неправильная**
3. **SSL сертификат не установлен**
4. **Firewall блокирует порты 80/443**
5. **Бекенд не запущен или не отвечает**
6. **CORS не настроен для фронтенда**
7. **DNS не настроен или не обновился**

---

## После исправления

Убедитесь, что:
- ✅ `https://api.kodifyweb.ru/health` возвращает JSON
- ✅ Формы на сайте отправляются без ошибок
- ✅ В консоли браузера (F12) нет ошибок CORS
- ✅ Запросы в Network tab идут на `https://api.kodifyweb.ru/api`
