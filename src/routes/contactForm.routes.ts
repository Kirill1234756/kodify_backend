import { Router, Request, Response } from 'express'
import { contactFormSchema, sanitizeInput, antibotGuard, normalizePhoneNumber } from '../middleware/validation'
import { generalRateLimit } from '../middleware/rateLimit'
import { DatabaseService } from '../services/databaseService'
import { EmailService } from '../services/emailService'
import { TelegramService } from '../services/telegramService'
import { BitrixService } from '../services/bitrixService'

const router = Router()

/**
 * POST /api/contact-form
 * Submit contact form
 */
router.post(
    '/',
    generalRateLimit,
    sanitizeInput,
    antibotGuard,
    async (req: Request, res: Response) => {
        try {
            // Validate form data
            const candidate = {
                ...req.body,
                phone: normalizePhoneNumber(req.body?.phone)
            }
            const { error, value } = contactFormSchema.validate(candidate, {
                abortEarly: false,
                stripUnknown: true
            })

            if (error) {
                const errors = error.details.reduce((acc: any, detail) => {
                    const field = detail.path.join('.')
                    acc[field] = detail.message
                    return acc
                }, {})

                return res.status(400).json({
                    success: false,
                    message: 'Ошибки валидации',
                    errors
                })
            }

            // Save to database
            const formRecord = await DatabaseService.saveContactForm(value)

            // Send notifications asynchronously (don't wait for them)
            Promise.allSettled([
                EmailService.sendContactFormNotification(value, formRecord),
                TelegramService.sendContactFormNotification(value, formRecord),
                (async () => {
                    const bitrixLeadId = await BitrixService.createContactFormLead(value, formRecord)
                    if (bitrixLeadId) {
                        await DatabaseService.updateFormStatus('contact_forms', formRecord.id, 'in_progress', bitrixLeadId)
                    }
                })()
            ]).then(results => {
                results.forEach((result, index) => {
                    const serviceNames = ['Email', 'Telegram', 'Bitrix']
                    if (result.status === 'fulfilled') {
                        console.log(`✅ ${serviceNames[index]} notification sent`)
                    } else {
                        console.error(`❌ ${serviceNames[index]} notification failed:`, result.reason)
                    }
                })
            }).catch(error => {
                console.error('Error in notifications:', error)
            })

            // Send confirmation email to client
            EmailService.sendClientConfirmation(value.email, value.name, 'contact').catch(error => {
                console.error('Error sending confirmation email:', error)
            })

            return res.status(200).json({
                success: true,
                message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
                clientId: formRecord.id
            })

        } catch (error) {
            console.error('Contact form submission error:', error)
            return res.status(500).json({
                success: false,
                message: 'Произошла ошибка при отправке формы. Попробуйте еще раз.'
            })
        }
    }
)

/**
 * GET /api/contact-form/:id
 * Get contact form by ID (for admin purposes)
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID заявки обязателен'
            })
        }

        const form = await DatabaseService.getFormById('contact_forms', id)

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Заявка не найдена'
            })
        }

        return res.status(200).json({
            success: true,
            data: form
        })

    } catch (error) {
        console.error('Error getting contact form:', error)
        return res.status(500).json({
            success: false,
            message: 'Ошибка при получении заявки'
        })
    }
})

/**
 * GET /api/contact-form
 * Get all contact forms with pagination (for admin purposes)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const status = req.query.status as string

        const result = await DatabaseService.getForms('contact_forms', page, limit, status)

        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: Math.ceil(result.total / result.limit)
            }
        })

    } catch (error) {
        console.error('Error getting contact forms:', error)
        return res.status(500).json({
            success: false,
            message: 'Ошибка при получении заявок'
        })
    }
})

/**
 * PUT /api/contact-form/:id/status
 * Update form status (for admin purposes)
 */
router.put('/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { status, bitrixLeadId } = req.body

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: 'ID заявки и статус обязательны'
            })
        }

        await DatabaseService.updateFormStatus('contact_forms', id, status, bitrixLeadId)

        return res.status(200).json({
            success: true,
            message: 'Статус заявки обновлен'
        })

    } catch (error) {
        console.error('Error updating form status:', error)
        return res.status(500).json({
            success: false,
            message: 'Ошибка при обновлении статуса заявки'
        })
    }
})

export default router

