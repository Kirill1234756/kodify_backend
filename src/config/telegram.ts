import dotenv from 'dotenv'

// Load .env before reading bot token/chat id
dotenv.config()

export const telegramConfig = {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    chatId: String(process.env.TELEGRAM_CHAT_ID || ''), // Ensure it's a string

    // Message templates
    templates: {
        clientForm: `🆕 Новая заявка!

📋 Тип: Детальная форма клиента
👤 Имя: {name}
🏢 Компания: {company}
📧 Email: {email}
📱 Телефон: {phone}
💰 Бюджет: {budget}

🧩 Описание компании:
{companyDescription}

🎯 Задача:
{task}

🧠 Видение решения:
{solutionVision}

✅ Ожидания:
{expectations}
{fileInfo}

🆔 ID: {id}
🕐 Время: {createdAt}`,

        contactForm: `🆕 Новая заявка!

📋 Тип: Контактная форма
👤 Имя: {name}
📧 Email: {email}
📱 Телефон: {phone}

🆔 ID: {id}
🕐 Время: {createdAt}`,

        calculatorForm: `💰 Новая заявка из калькулятора!

👤 Имя: {name}
📧 Email: {email}
📱 Телефон: {phone}

🌐 Тип сайта: {siteType}
📄 Страниц: {pages}
🎨 Дизайн: {design}
⚙️ Функционал: {features}
📝 Контент: {content}
🔍 SEO: {seo}
📢 Реклама: {ads}
⏰ Срочность: {urgency}
🛠️ Поддержка: {support}

💰 Стоимость: {calculatedPrice}₽
📊 Диапазон: {minPrice}₽ - {maxPrice}₽
⏱️ Срок: {timeline}

🆔 ID: {id}
🕐 Время: {createdAt}`
    },

    // Error messages
    errors: {
        BOT_TOKEN_MISSING: 'TELEGRAM_BOT_TOKEN is not set',
        CHAT_ID_MISSING: 'TELEGRAM_CHAT_ID is not set',
        SEND_FAILED: 'Failed to send Telegram message'
    }
} as const

if (!telegramConfig.botToken) {
    throw new Error(telegramConfig.errors.BOT_TOKEN_MISSING)
}

if (!telegramConfig.chatId) {
    throw new Error(telegramConfig.errors.CHAT_ID_MISSING)
}

