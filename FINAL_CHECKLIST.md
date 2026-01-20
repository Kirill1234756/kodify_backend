# ✅ Финальный чеклист после установки SSL

## Что уже готово ✅

- [x] SSL сертификат установлен для `api.kodifyweb.ru`
- [x] Nginx работает и настроен для HTTPS
- [x] Health check доступен: `https://api.kodifyweb.ru/health`

## Что нужно проверить/настроить 🔍

### 1. Проверить `.env` файл на сервере

Выполните на сервере:

```bash
cd ~/projects/kodify/backend
cat .env | grep -E "FRONTEND_URL|PUBLIC_URL|NODE_ENV"
```

**Должно быть:**
```env
NODE_ENV=production
FRONTEND_URL=https://kodifyweb.ru
FRONTEND_URLS=https://kodifyweb.ru,http://kodifyweb.ru
PUBLIC_URL=https://api.kodifyweb.ru
```

**Если нужно исправить:**
```bash
nano .env
# Внесите изменения, сохраните (Ctrl+O, Enter, Ctrl+X)
# Затем перезапустите контейнеры:
docker-compose down && docker-compose up -d
```

---

### 2. Проверить редирект HTTP → HTTPS

В браузере попробуйте открыть:
- `http://api.kodifyweb.ru/health` 

Должен автоматически редиректить на:
- `https://api.kodifyweb.ru/health`

Или через терминал:
```bash
curl -I http://api.kodifyweb.ru/health
# Должен вернуть: HTTP/1.1 301 Moved Permanently или Location: https://...
```

---

### 3. Проверить работу API эндпоинтов

```bash
# Health check
curl https://api.kodifyweb.ru/health

# Должен вернуть JSON с "success": true
```

Проверьте в браузере:
- `https://api.kodifyweb.ru/health` ✅ (уже работает)

---

### 4. Проверить логи бекенда

```bash
cd ~/projects/kodify/backend
docker-compose logs backend | tail -50

# Проверьте, нет ли ошибок CORS или других проблем
```

---

### 5. Настроить фронтенд (если еще не сделано)

**На сервере фронтенда или при сборке:**

Создайте/обновите `frontend/.env`:
```env
VITE_API_URL=https://api.kodifyweb.ru/api
```

Затем пересоберите фронтенд:
```bash
cd frontend
npm run build
```

---

### 6. Проверить работу форм с фронтенда

После настройки фронтенда протестируйте:

1. **Контактная форма** (`/contacts`)
   - Откройте DevTools (F12) → Network
   - Отправьте форму
   - Проверьте, что запрос идет на `https://api.kodifyweb.ru/api/contact-form`

2. **Форма "Стать клиентом"** (`/client-form`)
   - Проверьте отправку формы
   - Убедитесь, что запрос идет на `https://api.kodifyweb.ru/api/client-form`

3. **Калькулятор** (`/calculator`)
   - Проверьте отправку данных
   - Убедитесь, что запрос идет на `https://api.kodifyweb.ru/api/calculator-form`

---

### 7. Проверить CORS

Если получаете ошибки CORS во фронтенде:

1. Проверьте `.env` в бекенде - `FRONTEND_URL` должен быть `https://kodifyweb.ru`
2. Перезапустите бекенд:
   ```bash
   docker-compose restart backend
   ```
3. Проверьте логи:
   ```bash
   docker-compose logs backend | grep -i cors
   ```

---

### 8. Проверить базу данных

```bash
cd ~/projects/kodify/backend
docker-compose exec postgres psql -U kodify_user -d kodify_db -c "\dt"
```

Должны быть таблицы:
- `client_forms`
- `contact_forms`
- `calculator_forms`

---

### 9. Проверить автоматическое обновление сертификата

```bash
# Проверить, что автообновление настроено
sudo certbot renew --dry-run

# Должно показать, что сертификат будет обновлен
```

---

### 10. Финальная проверка всего функционала

1. ✅ **HTTPS работает:** `https://api.kodifyweb.ru/health`
2. ⏳ **Редирект HTTP→HTTPS:** проверьте `http://api.kodifyweb.ru/health`
3. ⏳ **Фронтенд настроен:** `VITE_API_URL=https://api.kodifyweb.ru/api`
4. ⏳ **Формы работают:** протестируйте отправку форм с сайта
5. ⏳ **CORS настроен:** нет ошибок CORS в консоли браузера

---

## Быстрые команды для проверки

```bash
# 1. Проверить .env
cat ~/projects/kodify/backend/.env | grep -E "FRONTEND_URL|PUBLIC_URL"

# 2. Проверить контейнеры
docker-compose ps

# 3. Проверить логи
docker-compose logs backend --tail=20

# 4. Проверить HTTPS
curl https://api.kodifyweb.ru/health

# 5. Проверить редирект
curl -I http://api.kodifyweb.ru/health

# 6. Проверить Nginx
sudo nginx -t
sudo systemctl status nginx

# 7. Проверить SSL сертификат
sudo certbot certificates
```

---

## Если что-то не работает

### Проблема: Ошибки CORS

**Решение:**
```bash
# Проверить FRONTEND_URL в .env
cat ~/projects/kodify/backend/.env | grep FRONTEND_URL

# Должно быть: FRONTEND_URL=https://kodifyweb.ru
# Если нет, обновите и перезапустите:
docker-compose restart backend
```

### Проблема: Формы не отправляются

**Решение:**
1. Проверьте в DevTools → Network, на какой адрес идут запросы
2. Убедитесь, что фронтенд использует `VITE_API_URL=https://api.kodifyweb.ru/api`
3. Пересоберите фронтенд после изменения `.env`

### Проблема: 404 ошибка на API

**Решение:**
1. Проверьте, что контейнер бекенда запущен: `docker-compose ps`
2. Проверьте логи: `docker-compose logs backend`
3. Проверьте health check: `curl https://api.kodifyweb.ru/health`

---

## 📝 Следующие шаги после настройки

1. **Мониторинг:** Настройте мониторинг uptime для API
2. **Бэкапы:** Настройте автоматические бэкапы базы данных
3. **Логи:** Настройте ротацию логов
4. **Обновления:** Настройте автоматические обновления безопасности
