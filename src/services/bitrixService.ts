import axios from 'axios'
import { bitrixConfig } from '../config/bitrix'
import { FormRecord } from './databaseService'

export interface BitrixLeadData {
    TITLE: string
    NAME: string
    LAST_NAME?: string
    COMPANY_TITLE?: string
    PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>
    EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>
    COMMENTS?: string
    SOURCE_ID?: string
    SOURCE_DESCRIPTION?: string
    UTM_SOURCE?: string
    UTM_MEDIUM?: string
    UTM_CAMPAIGN?: string
}

export class BitrixService {
    /**
     * Create lead from client form data
     */
    static async createClientFormLead(
        formData: any,
        formRecord: FormRecord
    ): Promise<number | null> {
        try {
            const leadData: BitrixLeadData = {
                TITLE: `Заявка от ${formData.company} - ${formData.name}`,
                NAME: formData.name.split(' ')[0] || formData.name,
                LAST_NAME: formData.name.split(' ').slice(1).join(' ') || undefined,
                COMPANY_TITLE: formData.company,
                PHONE: [{ VALUE: formData.phone, VALUE_TYPE: 'WORK' }],
                EMAIL: [{ VALUE: formData.email, VALUE_TYPE: 'WORK' }],
                COMMENTS: this.formatClientFormComments(formData),
                SOURCE_ID: bitrixConfig.sources.CLIENT_FORM,
                SOURCE_DESCRIPTION: 'Веб-сайт - Детальная форма клиента',
                UTM_SOURCE: 'website',
                UTM_MEDIUM: 'form',
                UTM_CAMPAIGN: 'client_form'
            }

            return await this.createLead(leadData)
        } catch (error) {
            console.error('Error creating client form lead:', error)
            return null
        }
    }

    /**
     * Create lead from contact form data
     */
    static async createContactFormLead(
        formData: any,
        formRecord: FormRecord
    ): Promise<number | null> {
        try {
            const leadData: BitrixLeadData = {
                TITLE: `Контактная заявка от ${formData.name}`,
                NAME: formData.name.split(' ')[0] || formData.name,
                LAST_NAME: formData.name.split(' ').slice(1).join(' ') || undefined,
                PHONE: [{ VALUE: formData.phone, VALUE_TYPE: 'WORK' }],
                EMAIL: [{ VALUE: formData.email, VALUE_TYPE: 'WORK' }],
                COMMENTS: this.formatContactFormComments(formData),
                SOURCE_ID: bitrixConfig.sources.CONTACT_SECTION,
                SOURCE_DESCRIPTION: 'Веб-сайт - Контактная форма',
                UTM_SOURCE: 'website',
                UTM_MEDIUM: 'form',
                UTM_CAMPAIGN: 'contact_form'
            }

            return await this.createLead(leadData)
        } catch (error) {
            console.error('Error creating contact form lead:', error)
            return null
        }
    }

    /**
     * Create lead from calculator form data
     */
    static async createCalculatorFormLead(
        formData: any,
        formRecord: FormRecord
    ): Promise<number | null> {
        try {
            const leadData: BitrixLeadData = {
                TITLE: `Заявка из калькулятора от ${formData.name}`,
                NAME: formData.name.split(' ')[0] || formData.name,
                LAST_NAME: formData.name.split(' ').slice(1).join(' ') || undefined,
                PHONE: [{ VALUE: formData.phone, VALUE_TYPE: 'WORK' }],
                EMAIL: formData.email ? [{ VALUE: formData.email, VALUE_TYPE: 'WORK' }] : undefined,
                COMMENTS: this.formatCalculatorFormComments(formData),
                SOURCE_ID: bitrixConfig.sources.CALCULATOR,
                SOURCE_DESCRIPTION: 'Веб-сайт - Калькулятор стоимости',
                UTM_SOURCE: 'website',
                UTM_MEDIUM: 'form',
                UTM_CAMPAIGN: 'calculator'
            }

            return await this.createLead(leadData)
        } catch (error) {
            console.error('Error creating calculator form lead:', error)
            return null
        }
    }

    /**
     * Create lead in Bitrix24
     */
    private static async createLead(leadData: BitrixLeadData): Promise<number | null> {
        try {
            let response

            if (bitrixConfig.webhookUrl) {
                // Use webhook method
                response = await this.createLeadViaWebhook(leadData)
            } else if (bitrixConfig.domain && bitrixConfig.userId && bitrixConfig.authToken) {
                // Use REST API method
                response = await this.createLeadViaAPI(leadData)
            } else {
                throw new Error(bitrixConfig.errors.NO_CONFIG)
            }

            if (response && response.result) {
                console.log(`Lead created successfully with ID: ${response.result}`)
                return response.result
            } else {
                console.error('Failed to create lead:', response)
                return null
            }
        } catch (error) {
            console.error('Error creating lead:', error)
            return null
        }
    }

    /**
     * Create lead via webhook
     */
    private static async createLeadViaWebhook(leadData: BitrixLeadData): Promise<any> {
        const url = `${bitrixConfig.webhookUrl}crm.lead.add`

        const response = await axios.post(url, {
            fields: leadData
        })

        return response.data
    }

    /**
     * Create lead via REST API
     */
    private static async createLeadViaAPI(leadData: BitrixLeadData): Promise<any> {
        const url = `https://${bitrixConfig.domain}/rest/${bitrixConfig.userId}/${bitrixConfig.authToken}/crm.lead.add`

        const response = await axios.post(url, {
            fields: leadData
        })

        return response.data
    }

    /**
     * Update lead status
     */
    static async updateLeadStatus(leadId: number, statusId: string): Promise<boolean> {
        try {
            let response

            if (bitrixConfig.webhookUrl) {
                const url = `${bitrixConfig.webhookUrl}crm.lead.update`
                response = await axios.post(url, {
                    id: leadId,
                    fields: { STATUS_ID: statusId }
                })
            } else if (bitrixConfig.domain && bitrixConfig.userId && bitrixConfig.authToken) {
                const url = `https://${bitrixConfig.domain}/rest/${bitrixConfig.userId}/${bitrixConfig.authToken}/crm.lead.update`
                response = await axios.post(url, {
                    id: leadId,
                    fields: { STATUS_ID: statusId }
                })
            } else {
                throw new Error(bitrixConfig.errors.NO_CONFIG)
            }

            return response.data && response.data.result
        } catch (error) {
            console.error('Error updating lead status:', error)
            return false
        }
    }

    /**
     * Get lead by ID
     */
    static async getLead(leadId: number): Promise<any> {
        try {
            let response

            if (bitrixConfig.webhookUrl) {
                const url = `${bitrixConfig.webhookUrl}crm.lead.get`
                response = await axios.post(url, { id: leadId })
            } else if (bitrixConfig.domain && bitrixConfig.userId && bitrixConfig.authToken) {
                const url = `https://${bitrixConfig.domain}/rest/${bitrixConfig.userId}/${bitrixConfig.authToken}/crm.lead.get`
                response = await axios.post(url, { id: leadId })
            } else {
                throw new Error(bitrixConfig.errors.NO_CONFIG)
            }

            return response.data && response.data.result
        } catch (error) {
            console.error('Error getting lead:', error)
            return null
        }
    }

    /**
     * Test Bitrix24 connection
     */
    static async testConnection(): Promise<boolean> {
        try {
            let response

            if (bitrixConfig.webhookUrl) {
                const url = `${bitrixConfig.webhookUrl}crm.lead.fields`
                response = await axios.post(url)
            } else if (bitrixConfig.domain && bitrixConfig.userId && bitrixConfig.authToken) {
                const url = `https://${bitrixConfig.domain}/rest/${bitrixConfig.userId}/${bitrixConfig.authToken}/crm.lead.fields`
                response = await axios.post(url)
            } else {
                throw new Error(bitrixConfig.errors.NO_CONFIG)
            }

            return response.data && response.data.result
        } catch (error) {
            console.error('Bitrix24 connection test failed:', error)
            return false
        }
    }

    /**
     * Format client form comments for Bitrix24
     */
    private static formatClientFormComments(formData: any): string {
        const fileName = formData.attachedFile?.fileName || 
                        (formData.attachedFile?.url ? 'Файл прикреплен' : null) ||
                        (formData.attached_file_name || null)
        
        const fileInfo = fileName ? `\n\nПрикрепленный файл: ${fileName}` : ''
        
        return `Описание компании:
${formData.companyDescription}

Задача:
${formData.task}

Видение решения:
${formData.solutionVision}

Ожидания:
${formData.expectations}

Бюджет:
${formData.budget}${fileInfo}`.trim()
    }

    /**
     * Format contact form comments for Bitrix24
     */
    private static formatContactFormComments(formData: any): string {
        return `
Контактная заявка

Имя: ${formData.name}
Email: ${formData.email}
Телефон: ${formData.phone}

Источник: Веб-сайт - Контактная форма
Время заявки: ${new Date().toLocaleString('ru-RU')}
    `.trim()
    }

    /**
     * Format calculator form comments for Bitrix24
     */
    private static formatCalculatorFormComments(formData: any): string {
        const siteTypeMap: Record<string, string> = {
            landing: 'Лендинг',
            business: 'Сайт-визитка',
            shop: 'Интернет-магазин',
            portfolio: 'Портфолио',
            blog: 'Блог/Медиа',
        }

        const designMap: Record<string, string> = {
            ready: 'Готовый дизайн',
            template: 'Адаптация шаблона',
            unique: 'Уникальный дизайн',
            premium: 'Премиум-дизайн',
        }

        const featuresList = Array.isArray(formData.features)
            ? formData.features.join(', ') || 'Нет'
            : 'Нет'

        return `
Заявка из калькулятора стоимости

Тип сайта: ${siteTypeMap[formData.siteType] || formData.siteType}
Количество страниц: ${formData.pages || '1 (лендинг)'}
Дизайн: ${designMap[formData.design] || formData.design}
Функционал: ${featuresList}
Контент: ${formData.content}
SEO: ${formData.seo}
Реклама: ${formData.ads ? 'Да' : 'Нет'}
Срочность: ${formData.urgency}
Поддержка: ${formData.support}

Расчетная стоимость: ${formData.calculatedPrice?.toLocaleString('ru-RU')}₽
Диапазон: ${formData.minPrice?.toLocaleString('ru-RU')}₽ - ${formData.maxPrice?.toLocaleString('ru-RU')}₽
Срок: ${formData.timeline}

Источник: Веб-сайт - Калькулятор стоимости
Время заявки: ${new Date().toLocaleString('ru-RU')}
    `.trim()
    }
}





