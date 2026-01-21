# 🔧 Исправление ошибки git pull

## ❌ Проблема:

```
error: Your local changes to the following files would be overwritten by merge:
    fix-api-connection.sh
Please commit your changes or stash them before you merge.
```

Это означает, что у вас есть локальные изменения в файле `fix-api-connection.sh`, которые конфликтуют с версией в Git.

---

## ✅ РЕШЕНИЕ:

### Вариант 1: Удалить локальные изменения (если они не нужны)

```bash
cd ~/projects/kodify/backend

# Удалить локальные изменения в файле
git checkout -- fix-api-connection.sh

# Или удалить ВСЕ локальные изменения
git reset --hard HEAD

# Теперь обновить код
git pull

# Сделать скрипты исполняемыми
chmod +x backup.sh restore.sh
```

### Вариант 2: Сохранить изменения временно (если они важны)

```bash
cd ~/projects/kodify/backend

# Сохранить изменения во временное хранилище
git stash

# Обновить код
git pull

# Сделать скрипты исполняемыми
chmod +x backup.sh restore.sh

# Если нужно вернуть ваши изменения:
git stash pop
```

### Вариант 3: Закоммитить изменения

```bash
cd ~/projects/kodify/backend

# Посмотреть что изменилось
git status

# Добавить изменения
git add fix-api-connection.sh

# Закоммитить
git commit -m "Local changes to fix-api-connection.sh"

# Обновить код
git pull

# Сделать скрипты исполняемыми
chmod +x backup.sh restore.sh
```

---

## 🎯 Рекомендуемый вариант:

Если файл `fix-api-connection.sh` был удалён из репозитория (он в списке удалённых файлов), лучше удалить локальные изменения:

```bash
cd ~/projects/kodify/backend
git reset --hard HEAD
git pull
chmod +x backup.sh restore.sh
```

---

## ✅ После исправления:

Проверьте что скрипты появились:

```bash
ls -la backup.sh restore.sh
```

Должны увидеть:
```
-rwxr-xr-x 1 root root ... backup.sh
-rwxr-xr-x 1 root root ... restore.sh
```

Теперь можно использовать:

```bash
./backup.sh
```
