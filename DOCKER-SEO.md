# Запуск бэкенда и БД через Docker (страница SEO ядро)

**Важно:** перед `docker compose up` должен быть запущен **Docker Desktop** (на Windows — иконка в трее, без него ошибка `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`).

## 1. Запуск контейнеров

Из папки **backend**:

```bash
docker compose up -d
```

Поднимаются PostgreSQL и бэкенд. Миграции (таблицы `seo_pages`, `seo_clusters`, `seo_keywords`) применяются при первом старте Postgres автоматически.

## 2. Заполнение данными (один раз после первого запуска)

Из папки **backend** (на хосте, не в контейнере):

```bash
npm run db:seed-seo
npm run db:import-seo -- "C:\путь\к\SEO_Ядро_Kodify_FINAL_1073_запросов.csv"
```

Скрипты и бэкенд используют одну и ту же БД: скрипты — localhost:5432, бэкенд в Docker — host.docker.internal:5432 (тот же порт хоста).

## 3. Фронтенд

Из папки **frontend**:

```bash
npm run dev
```

Открой в браузере: **http://localhost:5173/seo-core**

Фронт ходит в API по адресу **http://localhost:3000** (бэкенд в Docker).

## 4. Проверка

- Бэкенд: http://localhost:3000/health  
- Страница SEO ядро (SSR): **http://localhost:3000/seo-core**  
- Фронт перенаправляет `/seo-core` на бэкенд: http://localhost:5173/seo-core → 3000/seo-core

Страница SEO ядро рендерится на сервере (SSR): данные подставляются в HTML, без загрузки Vue/JS для таблицы.

В логах бэкенда при старте должно быть: `Server running at http://localhost:3000`.
