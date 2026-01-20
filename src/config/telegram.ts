import dotenv from 'dotenv'

// Load .env before reading bot token/chat id
dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'
const isTelegramConfigured = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)

export const telegramConfig = {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: String(process.env.TELEGRAM_CHAT_ID || ''), // Ensure it's a string

    // Check if Telegram is configured
    isConfigured: isTelegramConfigured,

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

// Validate configuration only if Telegram is needed
// In production, Telegram is optional unless explicitly configured
if (!isTelegramConfigured) {
    if (isProduction) {
        // In production, log warning but don't crash
        console.warn('⚠️  Telegram configuration is missing. Telegram notifications will be disabled.')
        console.warn('   Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable Telegram notifications.')
    } else {
        // In development, only warn if Telegram is actually used
        console.warn('⚠️  Telegram configuration is missing. Telegram features will not work.')
    }
}

