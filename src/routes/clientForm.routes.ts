import { Router, Request, Response } from 'express'
import { upload, handleMulterError } from '../middleware/fileUpload'
import { clientFormSchema, validateFileUpload, sanitizeInput, antibotGuard, normalizePhoneNumber } from '../middleware/validation'
import { generalRateLimit } from '../middleware/rateLimit'
import { DatabaseService } from '../services/databaseService'
import { EmailService } from '../services/emailService'
import { TelegramService } from '../services/telegramService'
import { BitrixService } from '../services/bitrixService'

const router = Router()

/**
 * POST /api/client-form
 * Submit client form with file upload
 */
router.post(
    '/',
    generalRateLimit,
    upload.single('attachedFile'),
    handleMulterError,
    validateFileUpload,
    sanitizeInput,
    antibotGuard,
    async (req: Request, res: Response) => {
        try {
            // Extract form data
            const formData = {
                companyDescription: req.body.companyDescription,
                task: req.body.task,
                solutionVision: req.body.solutionVision,
                expectations: req.body.expectations,
                budget: req.body.budget,
                name: req.body.name,
                company: req.body.company,
                phone: normalizePhoneNumber(req.body.phone),
                email: req.body.email,
                privacyAccepted: req.body.privacyAccepted === 'true' || req.body.privacyAccepted === true,
                attachedFile: (req as any).file // <-- каст
            }

            // Validate form data
            const { error, value } = clientFormSchema.validate(formData, {
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
                }) // <-- явный return
            }

            // Save to database
            const formRecord = await DatabaseService.saveClientForm(value)

            // Prepare data for notifications
            const notificationData = {
                ...value,
                attachedFile: value.attachedFile ? {
                    url: (formRecord as any).attached_file_url,
                    fileName: (formRecord as any).attached_file_name,
                    fileSize: (formRecord as any).attached_file_size
                } : null
            }

            // Send notifications asynchronously (don't wait for them)
            Promise.allSettled([
                EmailService.sendClientFormNotification(notificationData, formRecord),
                TelegramService.sendClientFormNotification(notificationData, formRecord),
                (async () => {
                    const bitrixLeadId = await BitrixService.createClientFormLead(notificationData, formRecord)
                    if (bitrixLeadId) {
                        await DatabaseService.updateFormStatus('client_forms', formRecord.id, 'in_progress', bitrixLeadId)
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
            EmailService.sendClientConfirmation(value.email, value.name, 'client').catch(error => {
                console.error('Error sending confirmation email:', error)
            })

            res.status(200).json({
                success: true,
                message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
                clientId: formRecord.id
            })
            return // <-- явный return
        } catch (error) {
            console.error('Client form submission error:', error)
            return res.status(500).json({
                success: false,
                message: 'Произошла ошибка при отправке формы. Попробуйте еще раз.'
            }) // <-- явный return
        }
    }
)

/**
 * GET /api/client-form/:id
 * Get client form by ID (for admin purposes)
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

        const form = await DatabaseService.getFormById('client_forms', id)

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
        console.error('Error getting client form:', error)
        return res.status(500).json({
            success: false,
            message: 'Ошибка при получении заявки'
        })
    }
})

/**
 * GET /api/client-form
 * Get all client forms with pagination (for admin purposes)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const status = req.query.status as string

        const result = await DatabaseService.getForms('client_forms', page, limit, status)

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
        console.error('Error getting client forms:', error)
        return res.status(500).json({
            success: false,
            message: 'Ошибка при получении заявок'
        })
    }
})

/**
 * PUT /api/client-form/:id/status
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

        await DatabaseService.updateFormStatus('client_forms', id, status, bitrixLeadId)

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

