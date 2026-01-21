# 💾 Настройка бекапов для бекенда

## 📋 Что бекапится:

1. **База данных PostgreSQL** - полный дамп всех таблиц и данных
2. **Загруженные файлы** - директория `uploads` с файлами пользователей
3. **Метаинформация** - информация о бекапе (дата, размеры, конфигурация)

---

## 🚀 Быстрый старт:

### Создать бекап:

```bash
cd ~/projects/kodify/backend
chmod +x backup.sh
./backup.sh
```

### Восстановить из бекапа:

```bash
chmod +x restore.sh
./restore.sh
```

---

## ⚙️ Автоматизация бекапов:

### Вариант 1: Cron (рекомендуется)

Добавьте в crontab для ежедневных бекапов в 2:00 ночи:

```bash
crontab -e
```

Добавьте строку:
```
0 2 * * * cd /root/projects/kodify/backend && ./backup.sh >> /var/log/kodify-backup.log 2>&1
```

### Вариант 2: Еженедельные бекапы

```
0 2 * * 0 cd /root/projects/kodify/backend && ./backup.sh >> /var/log/kodify-backup.log 2>&1
```

### Вариант 3: Несколько раз в день (каждые 6 часов)

```
0 */6 * * * cd /root/projects/kodify/backend && ./backup.sh >> /var/log/kodify-backup.log 2>&1
```

---

## 📁 Структура бекапов:

Бекапы сохраняются в директории `./backups/`:

```
backups/
├── database_2026-01-21_15-30-00.sql.gz    # Дамп базы данных
├── uploads_2026-01-21_15-30-00.tar.gz     # Архив загруженных файлов
└── backup_info_2026-01-21_15-30-00.txt    # Информация о бекапе
```

---

## 🔧 Настройка скриптов:

### Переменные окружения:

Скрипты автоматически читают переменные из `.env`:
- `DB_NAME` - имя базы данных (по умолчанию: `kodify_db`)
- `DB_USER` - пользователь БД (по умолчанию: `postgres`)
- `DB_HOST` - хост БД (по умолчанию: `postgres`)

### Изменить директорию для бекапов:

Отредактируйте `backup.sh`, измените строку:
```bash
BACKUP_DIR="./backups"
```

На например:
```bash
BACKUP_DIR="/var/backups/kodify"
```

---

## 🗑️ Очистка старых бекапов:

Скрипт автоматически удаляет бекапы старше 30 дней.

Чтобы изменить период хранения, отредактируйте `backup.sh`:
```bash
# Было:
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# Станет (например, хранить 7 дней):
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
```

---

## 📤 Копирование бекапов на другой сервер:

### SCP:

```bash
# Копировать все бекапы
scp -r root@89.111.142.190:~/projects/kodify/backend/backups /local/backup/path/

# Копировать последний бекап
scp root@89.111.142.190:~/projects/kodify/backend/backups/database_*.sql.gz /local/backup/path/
```

### RSYNC:

```bash
rsync -avz root@89.111.142.190:~/projects/kodify/backend/backups/ /local/backup/path/
```

### Автоматическая отправка на удаленный сервер (добавить в backup.sh):

```bash
# В конце backup.sh добавьте:
REMOTE_SERVER="user@backup-server.com"
REMOTE_PATH="/backups/kodify"
scp "$DB_BACKUP_FILE" "$REMOTE_SERVER:$REMOTE_PATH/"
scp "$FILES_BACKUP_FILE" "$REMOTE_SERVER:$REMOTE_PATH/"
```

---

## 🔍 Проверка бекапов:

### Просмотр списка бекапов:

```bash
ls -lh ./backups/
```

### Проверка размера бекапов:

```bash
du -sh ./backups/
```

### Проверка содержимого дампа БД (без распаковки):

```bash
zcat ./backups/database_2026-01-21_15-30-00.sql.gz | head -50
```

### Проверка содержимого архива файлов:

```bash
tar -tzf ./backups/uploads_2026-01-21_15-30-00.tar.gz | head -20
```

---

## 🔄 Восстановление:

### Восстановить только базу данных:

```bash
./restore.sh
# Выберите backup файл
# Откажитесь от восстановления файлов (no)
```

### Восстановить базу и файлы:

```bash
./restore.sh
# Выберите backup файл для БД
# Подтвердите восстановление файлов (yes)
# Выберите backup файл для файлов
```

### Восстановить конкретный файл (вручную):

```bash
gunzip -c ./backups/database_2026-01-21_15-30-00.sql.gz | docker-compose exec -T postgres psql -U postgres -d kodify_db
```

---

## ⚠️ Важные замечания:

1. **Перед восстановлением** убедитесь, что контейнеры запущены:
   ```bash
   docker-compose ps
   ```

2. **Бекапы занимают место** - следите за размером директории `backups/`

3. **Храните бекапы в нескольких местах** - не полагайтесь только на один сервер

4. **Тестируйте восстановление** - периодически проверяйте, что бекапы работают

5. **Перед важными обновлениями** обязательно создайте бекап вручную:
   ```bash
   ./backup.sh
   ```

---

## 📊 Мониторинг бекапов:

### Проверить последний бекап:

```bash
ls -lt ./backups/database_*.sql.gz | head -1
```

### Проверить размер всех бекапов:

```bash
du -ch ./backups/*.sql.gz | tail -1
du -ch ./backups/*.tar.gz | tail -1
```

### Создать отчет о бекапах:

```bash
cat << EOF > ./backup_report.txt
=== Backup Report ===
Date: $(date)

Total backups: $(ls -1 ./backups/database_*.sql.gz 2>/dev/null | wc -l)
Total size: $(du -sh ./backups/ | cut -f1)

Latest backup: $(ls -1t ./backups/database_*.sql.gz 2>/dev/null | head -1)
EOF
cat ./backup_report.txt
```

---

## 🆘 Устранение неполадок:

### Ошибка "permission denied":

```bash
chmod +x backup.sh restore.sh
```

### Ошибка "database not found":

Проверьте переменные в `.env`:
```bash
grep DB_ .env
```

### Ошибка при восстановлении:

Убедитесь, что база данных пустая или можно её пересоздать:
```bash
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS kodify_db;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE kodify_db;"
```

---

## 📝 Пример использования:

```bash
# Создать бекап
./backup.sh

# Посмотреть бекапы
ls -lh ./backups/

# Восстановить из бекапа
./restore.sh
# Введите "yes" для подтверждения
# Выберите номер бекапа
# Введите "yes" или "no" для восстановления файлов

# Перезапустить бекенд после восстановления
docker-compose restart backend
```
