import nodemailer from 'nodemailer'
import { emailConfig } from '../config/email'
import { FormRecord } from './databaseService'

export class EmailService {
    private static transporter: nodemailer.Transporter | null = null

    /**
     * Initialize email transporter
     */
    private static async getTransporter(): Promise<nodemailer.Transporter> {
        if (!emailConfig.isConfigured) {
            throw new Error('Email is not configured')
        }

        if (!this.transporter) {
            this.transporter = nodemailer.createTransport(emailConfig.smtp)

            // Verify connection
            try {
                await this.transporter.verify()
                console.log('Email transporter verified successfully')
            } catch (error) {
                // В разработке не падаем, а просто предупреждаем
                console.warn('Email transporter verification failed (will continue):', error)
            }
        }

        return this.transporter
    }

    /**
     * Send client form notification to admin
     */
    static async sendClientFormNotification(
        formData: any,
        formRecord: FormRecord
    ): Promise<void> {
        // Skip if email is not configured
        if (!emailConfig.isConfigured) {
            console.log('Email not configured, skipping email notification')
            return
        }

        try {
            const transporter = await this.getTransporter()

            const fileInfo = formData.attachedFile
                ? `<p><strong>Прикрепленный файл:</strong> <a href="${EmailService.escapeHtml(formData.attachedFile.url)}">${EmailService.escapeHtml(formData.attachedFile.fileName)}</a> (${this.formatFileSize(formData.attachedFile.fileSize)})</p>`
                : '<p><strong>Прикрепленный файл:</strong> Нет</p>'

            const html = emailConfig.templates.clientForm.html
                .replace(/{name}/g, EmailService.escapeHtml(formData.name || ''))
                .replace(/{company}/g, EmailService.escapeHtml(formData.company || ''))
                .replace(/{email}/g, EmailService.escapeHtml(formData.email || ''))
                .replace(/{phone}/g, EmailService.escapeHtml(formData.phone || ''))
                .replace(/{budget}/g, EmailService.escapeHtml(formData.budget || ''))
                .replace(/{companyDescription}/g, EmailService.escapeHtml(formData.companyDescription || ''))
                .replace(/{task}/g, EmailService.escapeHtml(formData.task || ''))
                .replace(/{solutionVision}/g, EmailService.escapeHtml(formData.solutionVision || ''))
                .replace(/{expectations}/g, EmailService.escapeHtml(formData.expectations || ''))
                .replace(/{fileInfo}/g, fileInfo)
                .replace(/{id}/g, EmailService.escapeHtml(formRecord.id))
                .replace(/{createdAt}/g, new Date(formRecord.created_at).toLocaleString('ru-RU'))

            const subject = emailConfig.templates.clientForm.subject.replace(/{company}/g, EmailService.escapeHtml(formData.company || ''))

            await transporter.sendMail({
                from: emailConfig.smtp.auth.user,
                to: emailConfig.adminEmail,
                subject,
                html
            })

            console.log('Client form notification sent successfully')
        } catch (error) {
            console.error('Error sending client form notification:', error)
            throw new Error(emailConfig.errors.SEND_FAILED)
        }
    }

    /**
     * Send contact form notification to admin
     */
    static async sendContactFormNotification(
        formData: any,
        formRecord: FormRecord
    ): Promise<void> {
        // Skip if email is not configured
        if (!emailConfig.isConfigured) {
            console.log('Email not configured, skipping email notification')
            return
        }

        try {
            const transporter = await this.getTransporter()

            const html = emailConfig.templates.contactForm.html
                .replace(/{name}/g, EmailService.escapeHtml(formData.name || ''))
                .replace(/{email}/g, EmailService.escapeHtml(formData.email || ''))
                .replace(/{phone}/g, EmailService.escapeHtml(formData.phone || ''))
                .replace(/{id}/g, EmailService.escapeHtml(formRecord.id))
                .replace(/{createdAt}/g, new Date(formRecord.created_at).toLocaleString('ru-RU'))

            const subject = emailConfig.templates.contactForm.subject.replace(/{name}/g, EmailService.escapeHtml(formData.name || ''))

            await transporter.sendMail({
                from: emailConfig.smtp.auth.user,
                to: emailConfig.adminEmail,
                subject,
                html
            })

            console.log('Contact form notification sent successfully')
        } catch (error) {
            console.error('Error sending contact form notification:', error)
            throw new Error(emailConfig.errors.SEND_FAILED)
        }
    }

    /**
     * Send confirmation email to client
     */
    static async sendClientConfirmation(
        clientEmail: string,
        clientName: string,
        formType: 'client' | 'contact' | 'calculator'
    ): Promise<void> {
        try {
            const transporter = await this.getTransporter()

            const subject = 'Спасибо за вашу заявку!'
            const html = `
        <h2>Здравствуйте, ${clientName}!</h2>
        <p>Спасибо за вашу заявку. Мы получили ваше сообщение и свяжемся с вами в ближайшее время.</p>
        <p>Наша команда рассмотрит вашу заявку и ответит в течение 24 часов.</p>
        <p>Если у вас есть срочные вопросы, вы можете связаться с нами по телефону или email.</p>
        <br>
        <p>С уважением,<br>Команда IT Company</p>
      `

            await transporter.sendMail({
                from: emailConfig.smtp.auth.user,
                to: clientEmail,
                subject,
                html
            })

            console.log(`Confirmation email sent to ${clientEmail}`)
        } catch (error) {
            console.error('Error sending confirmation email:', error)
            // Don't throw error for confirmation emails - they're not critical
        }
    }

    /**
     * Format file size for display
     */
    private static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes'

        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    /**
     * Test email configuration
     */
    static async testEmailConfiguration(): Promise<boolean> {
        if (!emailConfig.isConfigured) {
            console.log('Email is not configured, test skipped')
            return false
        }

        try {
            const transporter = await this.getTransporter()

            await transporter.sendMail({
                from: emailConfig.smtp.auth.user,
                to: emailConfig.adminEmail,
                subject: 'Test Email Configuration',
                html: '<p>This is a test email to verify email configuration.</p>'
            })

            console.log('Email configuration test successful')
            return true
        } catch (error) {
            console.error('Email configuration test failed:', error)
            return false
        }
    }

    // Basic HTML escaping to prevent header/body injection
    private static escapeHtml(text: string): string {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }
}

