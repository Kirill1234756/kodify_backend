import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

// Helpers
const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F]/g
const DANGEROUS_TOKENS = /(javascript:|data:text\/html|<script|on[a-z]+\s*=)/gi

// Normalize Russian phone numbers to E.164 (+7XXXXXXXXXX)
export const normalizePhoneNumber = (raw: string): string => {
    if (!raw) return raw
    const digits = raw.replace(/\D/g, '')
    let normalized = digits
    if (digits.startsWith('8') && digits.length === 11) {
        normalized = '7' + digits.slice(1)
    } else if (digits.startsWith('7') && digits.length === 11) {
        normalized = digits
    } else if (digits.length === 10) {
        normalized = '7' + digits
    }
    return normalized.length === 11 ? `+${normalized}` : raw
}

// Client form validation schema
export const clientFormSchema = Joi.object({
    companyDescription: Joi.string().min(10).max(2000).optional().allow('').messages({
        'string.min': 'Описание компании должно содержать минимум 10 символов',
        'string.max': 'Описание компании не должно превышать 2000 символов'
    }),
    task: Joi.string().min(10).max(1000).optional().allow('').messages({
        'string.min': 'Задача должна содержать минимум 10 символов',
        'string.max': 'Задача не должна превышать 1000 символов'
    }),
    solutionVision: Joi.string().min(10).max(1000).optional().allow('').messages({
        'string.min': 'Видение решения должно содержать минимум 10 символов',
        'string.max': 'Видение решения не должно превышать 1000 символов'
    }),
    expectations: Joi.string().min(10).max(1000).optional().allow('').messages({
        'string.min': 'Ожидания должны содержать минимум 10 символов',
        'string.max': 'Ожидания не должны превышать 1000 символов'
    }),
    budget: Joi.string().min(3).max(100).optional().allow('').messages({
        'string.min': 'Бюджет должен содержать минимум 3 символа',
        'string.max': 'Бюджет не должен превышать 100 символов'
    }),
    name: Joi.string().min(2).max(100).optional().allow('').messages({
        'string.min': 'Имя должно содержать минимум 2 символа',
        'string.max': 'Имя не должно превышать 100 символов'
    }),
    company: Joi.string().min(2).max(200).optional().allow('').messages({
        'string.min': 'Название компании должно содержать минимум 2 символа',
        'string.max': 'Название компании не должно превышать 200 символов'
    }),
    phone: Joi.string().min(10).pattern(/^[\+]?[0-9\s\-\(\)]{10,}$/).optional().allow('').messages({
        'string.min': 'Номер телефона должен содержать минимум 10 цифр',
        'string.pattern.base': 'Введите корректный номер телефона'
    }),
    email: Joi.string().email({ tlds: { allow: false } }).optional().allow('').messages({
        'string.email': 'Введите корректный email адрес'
    }),
    privacyAccepted: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false', '1', '0'),
        Joi.string().empty('').default(false)
    ).optional().default(false).custom((value) => {
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
            return value === 'true' || value === '1' || value === 'yes'
        }
        return false
    }),
    attachedFile: Joi.any().optional(), // File object from multer
    // Anti-bot fields
    honeypot: Joi.string().allow('', null).optional(),
    formStartedAt: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().pattern(/^\d+$/).custom((value) => Number(value))
    ).optional()
})

// Contact form validation schema
export const contactFormSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Имя должно содержать минимум 2 символа',
        'string.max': 'Имя не должно превышать 100 символов',
        'any.required': 'Имя обязательно для заполнения'
    }),
    phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{10,}$/).required().messages({
        'string.pattern.base': 'Введите корректный номер телефона',
        'any.required': 'Телефон обязателен для заполнения'
    }),
    email: Joi.string().email({ tlds: { allow: false } }).required().messages({
        'string.email': 'Введите корректный email адрес',
        'any.required': 'Email обязателен для заполнения'
    }),
    // Anti-bot fields
    honeypot: Joi.string().allow('', null),
    formStartedAt: Joi.number().integer().min(0)
})

// Calculator form validation schema (упрощенная, как в contact form)
export const calculatorFormSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Имя должно содержать минимум 2 символа',
        'string.max': 'Имя не должно превышать 100 символов',
        'any.required': 'Имя обязательно для заполнения'
    }),
    phone: Joi.string().min(10).max(20).required().messages({
        'string.min': 'Введите корректный номер телефона',
        'string.max': 'Введите корректный номер телефона',
        'any.required': 'Телефон обязателен для заполнения'
    }),
    email: Joi.string().email({ tlds: { allow: false } }).allow('', null).optional().messages({
        'string.email': 'Введите корректный email адрес'
    }),
    siteType: Joi.string().required().messages({
        'any.required': 'Тип сайта обязателен для заполнения'
    }),
    pages: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.valid(null, '')).optional(),
    design: Joi.string().required().messages({
        'any.required': 'Дизайн обязателен для заполнения'
    }),
    features: Joi.any().optional().default([]).custom((value, helpers) => {
        // Always return array, handle any input type
        try {
            // Handle undefined, null, or empty string
            if (value === undefined || value === null || value === '') {
                return []
            }

            // Convert string to array if needed
            if (typeof value === 'string') {
                const trimmed = value.trim()
                if (!trimmed) {
                    return []
                }
                try {
                    const parsed = JSON.parse(trimmed)
                    if (Array.isArray(parsed)) {
                        return parsed.filter(item => item !== null && item !== undefined && String(item).trim() !== '').map(item => String(item))
                    }
                    return []
                } catch {
                    // If not JSON, try splitting by comma
                    return trimmed.split(',').map((s: string) => s.trim()).filter(Boolean)
                }
            }

            // Handle array
            if (Array.isArray(value)) {
                return value.filter(item => item !== null && item !== undefined && String(item).trim() !== '').map(item => String(item))
            }

            // For any other type, try to convert to string and wrap in array
            return [String(value)].filter(Boolean)
        } catch (error) {
            // If anything goes wrong, return empty array
            console.warn('Error processing features field:', error, 'value:', value)
            return []
        }
    }),
    content: Joi.string().required().messages({
        'any.required': 'Контент обязателен для заполнения'
    }),
    seo: Joi.string().required().messages({
        'any.required': 'SEO обязателен для заполнения'
    }),
    ads: Joi.alternatives().try(Joi.boolean(), Joi.string(), Joi.number()).optional().default(false).custom((value) => {
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') return value === 'true' || value === '1'
        if (typeof value === 'number') return value !== 0
        return false
    }),
    urgency: Joi.string().required().messages({
        'any.required': 'Срочность обязательна для заполнения'
    }),
    support: Joi.string().required().messages({
        'any.required': 'Поддержка обязательна для заполнения'
    }),
    calculatedPrice: Joi.alternatives().try(Joi.number(), Joi.string()).optional().default(0).custom((value) => {
        if (typeof value === 'number') return value
        const num = Number(value)
        return isNaN(num) ? 0 : num
    }),
    minPrice: Joi.alternatives().try(Joi.number(), Joi.string()).optional().default(0).custom((value) => {
        if (typeof value === 'number') return value
        const num = Number(value)
        return isNaN(num) ? 0 : num
    }),
    maxPrice: Joi.alternatives().try(Joi.number(), Joi.string()).optional().default(0).custom((value) => {
        if (typeof value === 'number') return value
        const num = Number(value)
        return isNaN(num) ? 0 : num
    }),
    timeline: Joi.string().allow('', null).optional().default(''),
    // Anti-bot fields
    honeypot: Joi.string().allow('', null).optional(),
    formStartedAt: Joi.alternatives().try(Joi.number(), Joi.string()).optional().custom((value) => {
        if (typeof value === 'number') return value
        const num = Number(value)
        return isNaN(num) ? 0 : num
    })
})

// Validation middleware factory
export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // For calculator form, preprocess features field BEFORE validation
        // Check both path and originalUrl to catch calculator-form route
        const isCalculatorForm = req.path.includes('calculator') ||
            req.originalUrl.includes('calculator') ||
            req.url.includes('calculator')

        if (isCalculatorForm && req.body) {
            // Always normalize features to array
            if (req.body.features !== undefined) {
                try {
                    if (req.body.features === null || req.body.features === '') {
                        req.body.features = []
                    } else if (typeof req.body.features === 'string') {
                        try {
                            const parsed = JSON.parse(req.body.features)
                            req.body.features = Array.isArray(parsed) ? parsed : []
                        } catch {
                            // If not JSON, split by comma
                            req.body.features = req.body.features.split(',').map((s: string) => s.trim()).filter(Boolean)
                        }
                    } else if (!Array.isArray(req.body.features)) {
                        // Convert any other type to array
                        req.body.features = []
                    }
                    // Ensure all items are strings
                    if (Array.isArray(req.body.features)) {
                        req.body.features = req.body.features.map((item: any) => String(item)).filter((item: string) => item.trim() !== '')
                    }
                } catch (error) {
                    // If anything goes wrong, set to empty array
                    console.warn('Error preprocessing features:', error)
                    req.body.features = []
                }
            } else {
                // If features is not provided, set to empty array
                req.body.features = []
            }
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false
        })

        if (error) {
            const errors = error.details.reduce((acc: any, detail) => {
                const field = detail.path.join('.')
                acc[field] = detail.message
                return acc
            }, {})

            // Log validation errors for debugging
            if (process.env.NODE_ENV === 'development') {
                console.error('❌ Validation errors:', errors)
                console.error('📥 Request body:', JSON.stringify(req.body, null, 2))
            }

            return res.status(400).json({
                success: false,
                message: 'Ошибки валидации',
                errors
            })
        }

        req.body = value
        return next()
    }
}

// Client form validation middleware
export const validateClientForm = validateRequest(clientFormSchema)

// Contact form validation middleware
export const validateContactForm = validateRequest(contactFormSchema)

// Calculator form validation middleware
export const validateCalculatorForm = validateRequest(calculatorFormSchema)

// Sanitize input data
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    const sanitizeString = (str: string): string => {
        return str
            .replace(CONTROL_CHARS_REGEX, '')
            .trim()
            .replace(/[<>]/g, '')
            .replace(DANGEROUS_TOKENS, '')
            .replace(/\s{2,}/g, ' ')
    }

    const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
            return sanitizeString(obj)
        }
        if (typeof obj === 'object' && obj !== null) {
            // Don't sanitize arrays (like features) - just pass them through
            if (Array.isArray(obj)) {
                return obj
            }
            const sanitized: any = {}
            for (const key in obj) {
                // Skip sanitization for features array - it will be handled in validation
                if (key === 'features' && Array.isArray(obj[key])) {
                    sanitized[key] = obj[key]
                } else {
                    sanitized[key] = sanitizeObject(obj[key])
                }
            }
            return sanitized
        }
        return obj
    }

    req.body = sanitizeObject(req.body)
    next()
}

// Anti-bot guard
export const antibotGuard = (req: Request, res: Response, next: NextFunction) => {
    // В режиме разработки и на staging полностью отключаем антибот-проверку
    const nodeEnv = process.env.NODE_ENV || 'development'
    if (nodeEnv !== 'production') {
        console.log('🔓 Anti-bot guard disabled in', nodeEnv, 'mode')
        return next()
    }

    const { honeypot, formStartedAt } = req.body || {}

    // Check honeypot field - only trigger if it has meaningful content
    // Ignore empty strings, whitespace, or common autofill values
    const honeypotValue = String(honeypot || '').trim()

    // Список значений, которые считаются безопасными (автозаполнение браузера и т.д.)
    const safeValues = ['', 'undefined', 'null', 'false', '0', 'true', '1', 'yes', 'no']

    // Only flag as bot if honeypot has actual suspicious content
    // Проверяем, что значение не пустое И не входит в список безопасных значений
    if (honeypotValue && honeypotValue.length > 0 && !safeValues.includes(honeypotValue.toLowerCase())) {
        // Дополнительная проверка: если значение похоже на реальный текст (больше 2 символов и содержит буквы)
        const hasRealContent = honeypotValue.length > 2 && /[a-zA-Zа-яА-Я]/.test(honeypotValue)
        if (hasRealContent) {
            console.warn('⚠️ Bot detected - honeypot field filled with suspicious content:', honeypotValue)
            return res.status(400).json({ success: false, message: 'Bot detected' })
        }
    }

    // Check form submission time (only if formStartedAt is provided)
    if (formStartedAt !== undefined && formStartedAt !== null) {
        const started = typeof formStartedAt === 'number' ? formStartedAt : Number(formStartedAt)
        if (Number.isFinite(started) && started > 0) {
            const now = Date.now()
            const timeDiff = now - started

            // Reduced minimum time from 3 seconds to 1 second for better UX
            // This allows legitimate users to submit faster while still blocking bots
            if (timeDiff < 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Form submitted too fast. Please wait a moment and try again.'
                })
            }

            // Also check for suspiciously old timestamps (more than 1 hour)
            if (timeDiff > 3600000) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Form timestamp is very old:', timeDiff, 'ms')
                }
            }
        }
    }

    return next()
}

// Validate file upload
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
    const file = req.file

    if (!file) {
        return next() // File is optional
    }

    // Check file size (20MB max)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
        return res.status(400).json({
            success: false,
            message: 'Размер файла превышает максимально допустимый (20 МБ)'
        })
    }

    // Check file type
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: 'Неподдерживаемый тип файла. Разрешены: PDF, DOC, DOCX, TXT, JPG, PNG'
        })
    }

    next()
}

