# Настройка базы данных PostgreSQL

## Быстрая инструкция

### Вариант 1: Автоматическое создание таблиц (рекомендуется)

1. Убедитесь, что PostgreSQL установлен и запущен
2. Создайте базу данных (если еще не создана):

```bash
# Подключиться к PostgreSQL
sudo -u postgres psql

# Создать базу данных
CREATE DATABASE kodify_db;

# Выйти
\q
```

3. Настройте `.env` файл с параметрами подключения:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kodify_db
DB_USER=postgres
DB_PASSWORD=your_password
```

4. Запустите скрипт инициализации:

```bash
npm run db:init
```

Готово! Таблицы созданы автоматически.

---

### Вариант 2: Ручное создание через SQL

1. Подключитесь к базе данных:

```bash
psql -U postgres -d kodify_db
```

2. Выполните SQL миграцию:

```bash
psql -U postgres -d kodify_db -f sql/migrations/001_create_tables.sql
```

Или скопируйте содержимое файла `sql/migrations/001_create_tables.sql` и выполните в psql.

---

## Проверка

После создания таблиц проверьте:

```bash
# Запустить сервер
npm run dev

# Должно появиться:
# ✅ Database connection established
# 🗄️  Database: ✅ Working
```

Или через API:

```bash
curl http://localhost:3000/api/test/database
```

---

## Созданные таблицы

- `client_forms` - детальные заявки клиентов
- `contact_forms` - контактные заявки
- `calculator_forms` - заявки из калькулятора

Все таблицы создаются с индексами и триггерами для автоматического обновления `updated_at`.

---

## Устранение проблем

### Ошибка: "database does not exist"
```bash
# Создайте базу данных
sudo -u postgres psql
CREATE DATABASE kodify_db;
\q
```

### Ошибка: "permission denied"
```bash
# Дайте права пользователю
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE kodify_db TO your_user;
\q
```

### Ошибка подключения
- Проверьте параметры в `.env`
- Убедитесь, что PostgreSQL запущен: `sudo systemctl status postgresql`
- Проверьте, что порт 5432 открыт

