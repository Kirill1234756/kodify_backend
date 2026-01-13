import { Router, Request, Response } from 'express'
import { sanitizeInput, antibotGuard, normalizePhoneNumber, validateCalculatorForm } from '../middleware/validation'
import { generalRateLimit } from '../middleware/rateLimit'
import { DatabaseService } from '../services/databaseService'
import { EmailService } from '../services/emailService'
import { TelegramService } from '../services/telegramService'
import { BitrixService } from '../services/bitrixService'

const router = Router()

/**
 * POST /api/calculator-form
 * Submit calculator form
 */
router.post(
    '/',
    generalRateLimit,
    sanitizeInput,
    antibotGuard,
    validateCalculatorForm,
    async (req: Request, res: Response) => {
        try {
            // Prepare form data (already validated and sanitized)
            const formData = {
                ...req.body,
                phone: normalizePhoneNumber(req.body?.phone)
            }

            // Save to database
            const formRecord = await DatabaseService.saveCalculatorForm(formData)

            // Send notifications asynchronously (don't wait for them)
            Promise.allSettled([
                TelegramService.sendCalculatorFormNotification(formData, formRecord),
                (async () => {
                    const bitrixLeadId = await BitrixService.createCalculatorFormLead(formData, formRecord)
                    if (bitrixLeadId) {
                        await DatabaseService.updateFormStatus('calculator_forms', formRecord.id, 'in_progress', bitrixLeadId)
                    }
                })()
            ]).then(results => {
                results.forEach((result, index) => {
                    const serviceNames = ['Telegram', 'Bitrix']
                    if (result.status === 'fulfilled') {
                        console.log(`✅ ${serviceNames[index]} notification sent`)
                    } else {
                        console.error(`❌ ${serviceNames[index]} notification failed:`, result.reason)
                    }
                })
            }).catch(error => {
                console.error('Error in notifications:', error)
            })

            // Send confirmation email to client if email provided
            if (formData.email) {
                EmailService.sendClientConfirmation(formData.email, formData.name, 'calculator').catch(error => {
                    console.error('Error sending confirmation email:', error)
                })
            }

            return res.status(200).json({
                success: true,
                message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
                clientId: formRecord.id
            })

        } catch (error) {
            console.error('Calculator form submission error:', error)
            return res.status(500).json({
                success: false,
                message: 'Произошла ошибка при отправке формы. Попробуйте еще раз.'
            })
        }
    }
)

export default router


