# Настройка интеграции с Bitrix24

Пошаговая инструкция по настройке интеграции с Bitrix24 для автоматического создания лидов.

## 1. Создание приложения в Bitrix24

### 1.1 Создание приложения

1. Войдите в ваш Bitrix24 портал
2. Перейдите в **Маркетплейс** → **Разработчикам** → **Мои приложения**
3. Нажмите **Создать приложение**
4. Заполните данные:
   - **Название**: `IT Company Forms Integration`
   - **Описание**: `Интеграция для автоматического создания лидов из форм сайта`
   - **Категория**: `CRM`
   - **Версия**: `1.0.0`

### 1.2 Настройка прав доступа

В разделе **Права доступа** выберите:

- **crm** - Полный доступ к CRM
- **user** - Доступ к пользователям
- **im** - Доступ к чатам (опционально)

### 1.3 Получение данных приложения

После создания приложения вы получите:

- **CLIENT_ID** - ID приложения
- **CLIENT_SECRET** - Секретный ключ
- **REDIRECT_URI** - URL для перенаправления

## 2. Настройка Webhook (Рекомендуемый метод)

### 2.1 Создание Webhook

1. В Bitrix24 перейдите в **Настройки** → **Разработчикам** → **Входящие вебхуки**
2. Нажмите **Добавить вебхук**
3. Заполните данные:
   - **Название**: `IT Company Forms`
   - **Домен**: ваш домен (например: `company.bitrix24.ru`)
   - **Права доступа**: выберите нужные права
4. Скопируйте **URL вебхука**

### 2.2 Настройка переменных окружения

Добавьте в файл `.env`:

```env
# Bitrix24 Webhook Configuration
BITRIX24_WEBHOOK_URL=https://company.bitrix24.ru/rest/1/abc123def456/
```

## 3. Настройка REST API (Альтернативный метод)

### 3.1 Получение токена доступа

1. Перейдите в **Настройки** → **Разработчикам** → **Приложения**
2. Найдите ваше приложение
3. Нажмите **Настроить**
4. Получите **Токен доступа**

### 3.2 Настройка переменных окружения

```env
# Bitrix24 REST API Configuration
BITRIX24_DOMAIN=company.bitrix24.ru
BITRIX24_USER_ID=1
BITRIX24_AUTH_TOKEN=abc123def456ghi789
```

## 4. Настройка полей лида

### 4.1 Стандартные поля

Bitrix24 автоматически создает следующие поля для лидов:

- **TITLE** - Название лида
- **NAME** - Имя
- **LAST_NAME** - Фамилия
- **COMPANY_TITLE** - Название компании
- **PHONE** - Телефон
- **EMAIL** - Email
- **COMMENTS** - Комментарии
- **SOURCE_ID** - Источник
- **SOURCE_DESCRIPTION** - Описание источника

### 4.2 Создание пользовательских полей

1. Перейдите в **CRM** → **Настройки** → **Настройки полей**
2. Выберите **Лид**
3. Нажмите **Добавить поле**
4. Создайте поля для дополнительной информации:

```javascript
// Пример пользовательских полей
const customFields = {
  UF_CRM_LEAD_BUDGET: "Бюджет проекта",
  UF_CRM_LEAD_TASK: "Задача клиента",
  UF_CRM_LEAD_EXPECTATIONS: "Ожидания",
  UF_CRM_LEAD_COMPANY_DESCRIPTION: "Описание компании",
  UF_CRM_LEAD_SOLUTION_VISION: "Видение решения",
};
```

## 5. Настройка источников лидов

### 5.1 Создание источников

1. Перейдите в **CRM** → **Настройки** → **Источники лидов**
2. Создайте источники:

- **WEB** - Веб-сайт (общий)
- **WEB_CLIENT_FORM** - Детальная форма клиента
- **WEB_CONTACT_FORM** - Контактная форма

### 5.2 Настройка в коде

```typescript
// В bitrixService.ts
const sources = {
  CLIENT_FORM: "WEB_CLIENT_FORM",
  CONTACT_SECTION: "WEB_CONTACT_FORM",
};
```

## 6. Тестирование интеграции

### 6.1 Тест подключения

```bash
# Тест через API
curl -X GET "http://localhost:3000/api/test/bitrix"
```

### 6.2 Тест создания лида

```bash
# Тест создания лида через webhook
curl -X POST "https://company.bitrix24.ru/rest/1/abc123def456/crm.lead.add" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "TITLE": "Тестовый лид",
      "NAME": "Иван",
      "LAST_NAME": "Петров",
      "PHONE": [{"VALUE": "+7 999 123 45 67", "VALUE_TYPE": "WORK"}],
      "EMAIL": [{"VALUE": "ivan@example.com", "VALUE_TYPE": "WORK"}],
      "COMMENTS": "Тестовый лид из формы сайта"
    }
  }'
```

### 6.3 Тест через форму

1. Отправьте тестовую заявку через форму
2. Проверьте, что лид создался в Bitrix24
3. Проверьте заполнение всех полей

## 7. Настройка автоматических действий

### 7.1 Автоматические задачи

1. В Bitrix24 перейдите в **CRM** → **Настройки** → **Автоматические действия**
2. Создайте правило:

```javascript
// Условие: Лид создан
// Действие: Создать задачу менеджеру
const autoAction = {
  condition: "LEAD_CREATED",
  action: "CREATE_TASK",
  taskData: {
    TITLE: "Новый лид: {LEAD_TITLE}",
    DESCRIPTION: "Обработать заявку от {LEAD_NAME}",
    RESPONSIBLE_ID: "1", // ID менеджера
    DEADLINE: "+1 day",
  },
};
```

### 7.2 Уведомления

1. Настройте уведомления для менеджеров
2. Создайте шаблоны писем
3. Настройте SMS уведомления (если нужно)

## 8. Настройка воронки продаж

### 8.1 Статусы лидов

1. Перейдите в **CRM** → **Настройки** → **Статусы лидов**
2. Настройте статусы:

- **NEW** - Новый
- **IN_PROGRESS** - В работе
- **QUALIFIED** - Квалифицированный
- **UNQUALIFIED** - Неквалифицированный
- **CONVERTED** - Конвертирован

### 8.2 Этапы воронки

```javascript
const leadStages = {
  NEW: {
    name: "Новый",
    color: "#FFC107",
    sort: 10,
  },
  IN_PROGRESS: {
    name: "В работе",
    color: "#17A2B8",
    sort: 20,
  },
  QUALIFIED: {
    name: "Квалифицированный",
    color: "#28A745",
    sort: 30,
  },
  CONVERTED: {
    name: "Конвертирован",
    color: "#6F42C1",
    sort: 40,
  },
};
```

## 9. Мониторинг и аналитика

### 9.1 Отчеты по лидам

1. Создайте отчеты по источникам лидов
2. Настройте дашборды для менеджеров
3. Отслеживайте конверсию по источникам

### 9.2 Интеграция с аналитикой

```javascript
// Отправка метрик в Google Analytics
const sendAnalytics = async (leadData) => {
  await gtag("event", "lead_created", {
    event_category: "CRM",
    event_label: leadData.source,
    value: leadData.budget,
  });
};
```

## 10. Обработка ошибок

### 10.1 Обработка ошибок API

```typescript
// В bitrixService.ts
try {
  const response = await axios.post(webhookUrl, leadData);

  if (response.data.error) {
    console.error("Bitrix24 API error:", response.data.error);
    // Логирование ошибки
    // Отправка уведомления администратору
  }
} catch (error) {
  console.error("Bitrix24 connection error:", error);
  // Fallback: сохранение в локальную базу для повторной отправки
}
```

### 10.2 Повторная отправка

```typescript
// Очередь для повторной отправки
const retryQueue = [];

const retryFailedLeads = async () => {
  for (const lead of retryQueue) {
    try {
      await createLead(lead);
      retryQueue.splice(retryQueue.indexOf(lead), 1);
    } catch (error) {
      console.error("Retry failed:", error);
    }
  }
};

// Запуск каждые 5 минут
setInterval(retryFailedLeads, 5 * 60 * 1000);
```

## 11. Безопасность

### 11.1 Защита webhook URL

- **Используйте HTTPS**
- **Проверяйте подпись запроса**
- **Ограничьте доступ по IP**
- **Регулярно ротируйте ключи**

### 11.2 Валидация данных

```typescript
// Валидация данных перед отправкой
const validateLeadData = (leadData) => {
  const requiredFields = ["TITLE", "NAME", "PHONE", "EMAIL"];

  for (const field of requiredFields) {
    if (!leadData[field]) {
      throw new Error(`Required field ${field} is missing`);
    }
  }

  // Валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(leadData.EMAIL[0].VALUE)) {
    throw new Error("Invalid email format");
  }

  return true;
};
```

## 12. Оптимизация производительности

### 12.1 Батчинг запросов

```typescript
// Отправка нескольких лидов одним запросом
const batchCreateLeads = async (leads) => {
  const batch = leads.map((lead) => ({
    cmd: "crm.lead.add",
    params: { fields: lead },
  }));

  const response = await axios.post(webhookUrl, { batch });
  return response.data;
};
```

### 12.2 Кэширование

```typescript
// Кэширование данных пользователей
const userCache = new Map();

const getCachedUser = async (userId) => {
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }

  const user = await getUserFromBitrix(userId);
  userCache.set(userId, user);
  return user;
};
```

## 13. Troubleshooting

### 13.1 Частые проблемы

**Ошибка 401 Unauthorized:**

- Проверьте правильность webhook URL
- Убедитесь, что приложение активно
- Проверьте права доступа

**Ошибка 400 Bad Request:**

- Проверьте формат данных
- Убедитесь, что все обязательные поля заполнены
- Проверьте типы данных

**Ошибка 429 Too Many Requests:**

- Добавьте задержки между запросами
- Используйте батчинг
- Реализуйте очередь запросов

### 13.2 Логирование

```typescript
// Подробное логирование
const logBitrixRequest = (request, response) => {
  console.log("Bitrix24 Request:", {
    url: request.url,
    method: request.method,
    data: request.data,
    timestamp: new Date().toISOString(),
  });

  console.log("Bitrix24 Response:", {
    status: response.status,
    data: response.data,
    timestamp: new Date().toISOString(),
  });
};
```

## 14. Масштабирование

### 14.1 Множественные порталы

```typescript
// Поддержка нескольких Bitrix24 порталов
const bitrixPortals = [
  {
    name: "main",
    webhookUrl: "https://main.bitrix24.ru/rest/1/abc123/",
    sources: ["WEB_CLIENT_FORM"],
  },
  {
    name: "partners",
    webhookUrl: "https://partners.bitrix24.ru/rest/1/def456/",
    sources: ["WEB_CONTACT_FORM"],
  },
];

const selectPortal = (source) => {
  return bitrixPortals.find((portal) => portal.sources.includes(source));
};
```

### 14.2 Интеграция с другими CRM

```typescript
// Абстракция для работы с разными CRM
interface CRMProvider {
  createLead(leadData: any): Promise<any>;
  updateLead(leadId: string, data: any): Promise<any>;
  getLead(leadId: string): Promise<any>;
}

class Bitrix24Provider implements CRMProvider {
  // Реализация для Bitrix24
}

class AmoCRMProvider implements CRMProvider {
  // Реализация для AmoCRM
}
```







