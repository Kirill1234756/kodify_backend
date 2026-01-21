# 🔧 Исправление токена в nano и обновление кода на VPS

## ❌ Проблема 1: "Endpoint not found" для `/api/test/telegram`

Это означает, что **код на VPS не обновлен**. Нужно обновить код и перезапустить контейнер.

## ❌ Проблема 2: Ctrl+V не работает в nano через VNC

В VNC через браузер `Ctrl+V` не работает для вставки. Используйте другой способ.

---

## ✅ РЕШЕНИЕ:

### Шаг 1: Исправить токен в nano (правильный способ вставки)

#### Вариант А: Использовать Shift+Insert (рекомендуется)

1. Скопируйте правильный токен:
   ```
   8226522901:AAHJSZ8zpZ-UCSX40TmKb_bLb12FwTgzGyA
   ```

2. В nano:
   - Найдите строку с `TELEGRAM_BOT_TOKEN`
   - Переместите курсор на место дефиса `-` после `TmKb`
   - Нажмите `Delete` или `Backspace` чтобы удалить дефис
   - Нажмите **`Shift+Insert`** (это работает в VNC!)

#### Вариант Б: Использовать правую кнопку мыши

1. Скопируйте правильный токен
2. В nano:
   - Найдите нужное место
   - **Правый клик мыши** в окне nano
   - Выберите "Вставить" из контекстного меню

#### Вариант В: Ввести вручную посимвольно

1. Найдите дефис `-` между `TmKb` и `bLb`
2. Удалите его (Backspace)
3. Введите подчеркивание `_` (Shift + дефис на английской раскладке)

**Итоговый токен должен быть:**
```
TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX40TmKb_bLb12FwTgzGyA
```

4. Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

---

### Шаг 2: Обновить код на VPS

```bash
cd ~/projects/kodify/backend
git pull
```

Если выдает ошибку, проверьте статус:
```bash
git status
```

Если есть незакоммиченные изменения, либо закоммитьте их, либо сделайте stash:
```bash
git stash
git pull
```

---

### Шаг 3: Пересобрать Docker образ (если код изменился)

```bash
docker-compose build --no-cache backend
```

Или если изменения только в `.env`, просто перезапустите:
```bash
docker-compose restart backend
```

---

### Шаг 4: Проверить что эндпоинт работает

```bash
curl https://api.kodifyweb.ru/api/test/telegram
```

Должно вернуть:
```json
{
  "success": true,
  "message": "Telegram bot is working"
}
```

Если все еще "Endpoint not found":

1. Проверьте что код обновлен:
   ```bash
   docker-compose exec backend cat /app/src/server.ts | grep "test/telegram"
   ```
   
   Должна быть строка:
   ```typescript
   app.get('/api/test/telegram', async (req, res) => {
   ```

2. Проверьте логи:
   ```bash
   docker-compose logs --tail=50 backend
   ```

3. Перезапустите полностью:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## 🎯 Краткая инструкция:

1. ✅ Исправить токен в nano (используйте **Shift+Insert** или правый клик мыши)
2. ✅ Сохранить файл (`Ctrl+O`, `Enter`, `Ctrl+X`)
3. ✅ Обновить код: `cd ~/projects/kodify/backend && git pull`
4. ✅ Пересобрать/перезапустить: `docker-compose build --no-cache backend && docker-compose up -d`
5. ✅ Проверить: `curl https://api.kodifyweb.ru/api/test/telegram`

---

## 🔍 Проверка токена после исправления:

Чтобы убедиться что токен правильный в контейнере:

```bash
docker-compose exec backend env | grep TELEGRAM_BOT_TOKEN
```

Должно показать:
```
TELEGRAM_BOT_TOKEN=8226522901:AAHJSZ8zpZ-UCSX40TmKb_bLb12FwTgzGyA
```

(Обратите внимание на подчеркивание `_` после `TmKb`)
