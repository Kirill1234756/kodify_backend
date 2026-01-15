# Краткая инструкция по развертыванию

## Быстрый старт

1. **Подготовка сервера** - следуйте шагам 1-2 из `DEPLOY_UBUNTU.md`
2. **Загрузка проекта** на сервер
3. **Настройка .env** файла
4. **Запуск развертывания:**

```bash
cd ~/projects/it-company/backend
chmod +x deploy.sh
./deploy.sh
```

## Основные команды

```bash
# Запуск
docker compose up -d

# Остановка
docker compose down

# Логи
docker compose logs -f backend

# Перезапуск
docker compose restart backend

# Статус
docker compose ps
```

## Полная документация

См. `DEPLOY_UBUNTU.md` для полной инструкции по развертыванию на Ubuntu сервере.



