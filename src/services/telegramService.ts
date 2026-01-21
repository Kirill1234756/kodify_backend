import TelegramBot from 'node-telegram-bot-api'
import { telegramConfig } from '../config/telegram'
import { FormRecord } from './databaseService'

export class TelegramService {
    private static bot: TelegramBot | null = null

    /**
     * Initialize Telegram bot
     */
    private static getBot(): TelegramBot | null {
        if (!telegramConfig.isConfigured) {
            console.warn('⚠️  Telegram is not configured. Skipping Telegram notification.')
            return null
        }
        if (!this.bot) {
            this.bot = new TelegramBot(telegramConfig.botToken, { polling: false })
        }
        return this.bot
    }

    /**
     * Send client form notification
     */
    static async sendClientFormNotification(
        formData: any,
        formRecord: FormRecord
    ): Promise<void> {
        try {
            const bot = this.getBot()
            if (!bot) {
                return // Telegram not configured, skip silently
            }

            // Format file info if present
            const fileInfo = formData.attachedFile?.url || (formRecord as any).attached_file_url
                ? `\n📎 Прикрепленный файл: ${TelegramService.escapeHtml((formData.attachedFile?.fileName || (formRecord as any).attached_file_name) || 'Файл')}`
                : ''

            const message = telegramConfig.templates.clientForm
                .replace(/{name}/g, TelegramService.escapeHtml(formData.name || ''))
                .replace(/{company}/g, TelegramService.escapeHtml(formData.company || ''))
                .replace(/{email}/g, TelegramService.escapeHtml(formData.email || ''))
                .replace(/{phone}/g, TelegramService.escapeHtml(formData.phone || ''))
                .replace(/{budget}/g, TelegramService.escapeHtml(formData.budget || ''))
                .replace(/{companyDescription}/g, TelegramService.escapeHtml(formData.companyDescription || ''))
                .replace(/{task}/g, TelegramService.escapeHtml(formData.task || ''))
                .replace(/{solutionVision}/g, TelegramService.escapeHtml(formData.solutionVision || ''))
                .replace(/{expectations}/g, TelegramService.escapeHtml(formData.expectations || ''))
                .replace(/{fileInfo}/g, fileInfo)
                .replace(/{id}/g, TelegramService.escapeHtml(formRecord.id))
                .replace(/{createdAt}/g, new Date(formRecord.created_at).toLocaleString('ru-RU'))

            const chatId = String(telegramConfig.chatId)
            if (!chatId) {
                throw new Error('TELEGRAM_CHAT_ID is not set')
            }
            console.log(`Attempting to send message to chat: ${chatId}`)
            const result = await bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
            
            console.log('Client form notification sent to Telegram successfully')
            console.log('Message ID:', result.message_id)
        } catch (error: any) {
            console.error('❌ Error sending Telegram notification:', error)
            console.error('Error details:', {
                message: error?.message,
                response: error?.response?.body,
                code: error?.code,
                description: error?.description
            })
            // Don't throw - just log
        }
    }

    /**
     * Send contact form notification
     */
    static async sendContactFormNotification(
        formData: any,
        formRecord: FormRecord
    ): Promise<void> {
        try {
            const bot = this.getBot()
            if (!bot) {
                return // Telegram not configured, skip silently
            }

            const message = telegramConfig.templates.contactForm
                .replace(/{name}/g, TelegramService.escapeHtml(formData.name || ''))
                .replace(/{email}/g, TelegramService.escapeHtml(formData.email || ''))
                .replace(/{phone}/g, TelegramService.escapeHtml(formData.phone || ''))
                .replace(/{id}/g, TelegramService.escapeHtml(formRecord.id))
                .replace(/{createdAt}/g, new Date(formRecord.created_at).toLocaleString('ru-RU'))

            const chatId = String(telegramConfig.chatId)
            if (!chatId) {
                throw new Error('TELEGRAM_CHAT_ID is not set')
            }
            
            console.log(`Attempting to send message to chat: ${chatId}`)
            const result = await bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
            
            console.log('Contact form notification sent to Telegram successfully')
            console.log('Message ID:', result.message_id)
        } catch (error: any) {
            console.error('❌ Error sending Telegram notification:', error)
            console.error('Error details:', {
                message: error?.message,
                response: error?.response?.body,
                code: error?.code,
                description: error?.description
            })
            
            // Don't throw error - just log it so the form submission still succeeds
            // throw new Error(telegramConfig.errors.SEND_FAILED)
        }
    }

    /**
     * Send calculator form notification
     */
    static async sendCalculatorFormNotification(
        formData: any,
        formRecord: FormRecord
    ): Promise<void> {
        try {
            const bot = this.getBot()
            if (!bot) {
                return // Telegram not configured, skip silently
            }

            // Маппинг типов сайтов
            const siteTypeMap: Record<string, string> = {
                landing: 'Лендинг',
                business: 'Сайт-визитка',
                shop: 'Интернет-магазин',
                portfolio: 'Портфолио',
                blog: 'Блог/Медиа',
            }

            // Маппинг дизайна
            const designMap: Record<string, string> = {
                ready: 'Готовый дизайн',
                template: 'Адаптация шаблона',
                unique: 'Уникальный дизайн',
                premium: 'Премиум-дизайн',
            }

            // Маппинг контента
            const contentMap: Record<string, string> = {
                ready: 'Готовый контент',
                media: 'Нужны фото/иконки',
                copywriting: 'Копирайтинг',
                full: 'Полный контент',
            }

            // Маппинг SEO
            const seoMap: Record<string, string> = {
                basic: 'Базовое SEO',
                extended: 'Расширенное SEO',
                complex: 'Комплексное SEO',
            }

            // Маппинг срочности
            const urgencyMap: Record<string, string> = {
                standard: 'Стандартные сроки',
                fast: 'Ускоренная разработка',
                urgent: 'Срочно',
            }

            // Маппинг поддержки
            const supportMap: Record<string, string> = {
                none: 'Без поддержки',
                '1month': '1 месяц',
                '3months': '3 месяца',
                '6months': '6 месяцев',
                '12months': '12 месяцев',
            }

            const featuresList = Array.isArray(formData.features)
                ? formData.features.join(', ') || 'Нет'
                : 'Нет'

            const message = telegramConfig.templates.calculatorForm
                .replace(/{name}/g, TelegramService.escapeHtml(formData.name || ''))
                .replace(/{email}/g, TelegramService.escapeHtml(formData.email || ''))
                .replace(/{phone}/g, TelegramService.escapeHtml(formData.phone || ''))
                .replace(/{siteType}/g, TelegramService.escapeHtml(siteTypeMap[formData.siteType] || formData.siteType))
                .replace(/{pages}/g, TelegramService.escapeHtml(formData.pages || '1 (лендинг)'))
                .replace(/{design}/g, TelegramService.escapeHtml(designMap[formData.design] || formData.design))
                .replace(/{features}/g, TelegramService.escapeHtml(featuresList))
                .replace(/{content}/g, TelegramService.escapeHtml(contentMap[formData.content] || formData.content))
                .replace(/{seo}/g, TelegramService.escapeHtml(seoMap[formData.seo] || formData.seo))
                .replace(/{ads}/g, formData.ads ? 'Да (+20,000₽)' : 'Нет')
                .replace(/{urgency}/g, TelegramService.escapeHtml(urgencyMap[formData.urgency] || formData.urgency))
                .replace(/{support}/g, TelegramService.escapeHtml(supportMap[formData.support] || formData.support))
                .replace(/{calculatedPrice}/g, formData.calculatedPrice?.toLocaleString('ru-RU') || '0')
                .replace(/{minPrice}/g, formData.minPrice?.toLocaleString('ru-RU') || '0')
                .replace(/{maxPrice}/g, formData.maxPrice?.toLocaleString('ru-RU') || '0')
                .replace(/{timeline}/g, TelegramService.escapeHtml(formData.timeline || ''))
                .replace(/{id}/g, TelegramService.escapeHtml(formRecord.id))
                .replace(/{createdAt}/g, new Date(formRecord.created_at).toLocaleString('ru-RU'))

            const chatId = String(telegramConfig.chatId)
            if (!chatId) {
                throw new Error('TELEGRAM_CHAT_ID is not set')
            }
            console.log(`Attempting to send message to chat: ${chatId}`)
            const result = await bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
            
            console.log('Calculator form notification sent to Telegram successfully')
            console.log('Message ID:', result.message_id)
        } catch (error: any) {
            console.error('❌ Error sending Telegram notification:', error)
            console.error('Error details:', {
                message: error?.message,
                response: error?.response?.body,
                code: error?.code,
                description: error?.description
            })
            // Don't throw - just log
        }
    }

    /**
     * Send custom message
     */
    static async sendMessage(message: string): Promise<void> {
        try {
            const bot = this.getBot()
            if (!bot) {
                console.warn('⚠️  Telegram bot is not configured. Skipping message.')
                return
            }

            const chatId = String(telegramConfig.chatId)
            if (!chatId) {
                throw new Error('TELEGRAM_CHAT_ID is not set')
            }
            await bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })

            console.log('Custom message sent to Telegram')
        } catch (error) {
            console.error('Error sending custom Telegram message:', error)
            throw new Error(telegramConfig.errors.SEND_FAILED)
        }
    }

    /**
     * Send file to Telegram
     */
    static async sendFile(
        filePath: string,
        caption?: string
    ): Promise<void> {
        try {
            const bot = this.getBot()
            if (!bot) {
                console.warn('⚠️  Telegram bot is not configured. Skipping file upload.')
                return
            }

            await bot.sendDocument(telegramConfig.chatId, filePath, {
                caption: caption || 'Прикрепленный файл из заявки'
            })

            console.log('File sent to Telegram')
        } catch (error) {
            console.error('Error sending file to Telegram:', error)
            throw new Error(telegramConfig.errors.SEND_FAILED)
        }
    }

    /**
     * Test Telegram bot configuration
     */
    static async testBotConfiguration(): Promise<boolean> {
        try {
            if (!telegramConfig.isConfigured) {
                return false // Telegram not configured
            }
            
            const bot = this.getBot()
            if (!bot) {
                return false
            }

            const chatId = String(telegramConfig.chatId)
            if (!chatId) {
                throw new Error('TELEGRAM_CHAT_ID is not set')
            }
            
            // Try to get bot info first
            const botInfo = await bot.getMe()
            console.log('Bot info:', botInfo.username, botInfo.id)
            
            await bot.sendMessage(chatId, '🤖 Тест конфигурации Telegram бота', {
                parse_mode: 'HTML'
            })

            console.log('Telegram bot configuration test successful')
            return true
        } catch (error: any) {
            console.error('Telegram bot configuration test failed:', error)
            console.error('Error details:', {
                message: error?.message,
                response: error?.response?.body,
                code: error?.code,
                description: error?.description
            })
            return false
        }
    }

    /**
     * Get bot information
     */
    static async getBotInfo(): Promise<any> {
        try {
            const bot = this.getBot()
            if (!bot) {
                throw new Error('Telegram bot is not configured')
            }
            return await bot.getMe()
        } catch (error) {
            console.error('Error getting bot info:', error)
            throw error
        }
    }

    /**
     * Truncate text to specified length
     */
    private static truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text
        }
        return text.substring(0, maxLength) + '...'
    }

    /**
     * Format phone number for display
     */
    static formatPhoneNumber(phone: string): string {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '')

        // Format Russian phone numbers
        if (cleaned.startsWith('7') && cleaned.length === 11) {
            return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`
        }

        // Format other numbers
        if (cleaned.length >= 10) {
            return `+${cleaned}`
        }

        return phone
    }

    /**
     * Escape special characters for HTML
     */
    static escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }
}

