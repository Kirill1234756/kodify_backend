import dotenv from 'dotenv'

// Load .env to ensure SMTP vars are present in dev
dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'
const isEmailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.ADMIN_EMAIL)

export const emailConfig = {
    // SMTP configuration
    smtp: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    },

    // Email addresses
    adminEmail: process.env.ADMIN_EMAIL || '',

    // Check if email is configured
    isConfigured: isEmailConfigured,

    // Email templates
    templates: {
        clientForm: {
            subject: 'Новая заявка от клиента - {company}',
            html: `
        <h2>Новая заявка от клиента</h2>
        <p><strong>Тип:</strong> Детальная форма клиента</p>
        <p><strong>Имя:</strong> {name}</p>
        <p><strong>Компания:</strong> {company}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Телефон:</strong> {phone}</p>
        <p><strong>Бюджет:</strong> {budget}</p>
        
        <h3>Описание компании:</h3>
        <p>{companyDescription}</p>
        
        <h3>Задача:</h3>
        <p>{task}</p>
        
        <h3>Видение решения:</h3>
        <p>{solutionVision}</p>
        
        <h3>Ожидания:</h3>
        <p>{expectations}</p>
        
        {fileInfo}
        
        <p><strong>ID заявки:</strong> {id}</p>
        <p><strong>Время:</strong> {createdAt}</p>
      `
        },

        contactForm: {
            subject: 'Новая контактная заявка - {name}',
            html: `
        <h2>Новая контактная заявка</h2>
        <p><strong>Тип:</strong> Контактная форма</p>
        <p><strong>Имя:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Телефон:</strong> {phone}</p>
        
        <p><strong>ID заявки:</strong> {id}</p>
        <p><strong>Время:</strong> {createdAt}</p>
      `
        }
    },

    // Error messages
    errors: {
        SMTP_CONFIG_MISSING: 'SMTP configuration is missing',
        ADMIN_EMAIL_MISSING: 'ADMIN_EMAIL is not set',
        SEND_FAILED: 'Failed to send email'
    }
} as const

// Validate configuration only if email is needed
// In production, email is optional unless explicitly configured
if (!isEmailConfigured) {
    if (isProduction) {
        // In production, log warning but don't crash
        console.warn('⚠️  Email configuration is missing. Email notifications will be disabled.')
        console.warn('   Set SMTP_HOST, SMTP_USER, SMTP_PASS, and ADMIN_EMAIL to enable email.')
    } else {
        // In development, only warn if email is actually used
        console.warn('⚠️  Email configuration is missing. Email features will not work.')
    }
}

