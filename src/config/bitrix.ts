import dotenv from 'dotenv'

// Load .env so webhook or API tokens are available
dotenv.config()

export const bitrixConfig = {
    // Webhook method (preferred)
    webhookUrl: process.env.BITRIX24_WEBHOOK_URL,

    // REST API method (alternative)
    domain: process.env.BITRIX24_DOMAIN,
    userId: process.env.BITRIX24_USER_ID,
    authToken: process.env.BITRIX24_AUTH_TOKEN,

    // API endpoints
    endpoints: {
        leads: '/crm.lead.add',
        deals: '/crm.deal.add',
        contacts: '/crm.contact.add',
        companies: '/crm.company.add'
    },

    // Lead field mappings
    leadFields: {
        TITLE: 'TITLE',
        NAME: 'NAME',
        LAST_NAME: 'LAST_NAME',
        COMPANY_TITLE: 'COMPANY_TITLE',
        PHONE: 'PHONE',
        EMAIL: 'EMAIL',
        COMMENTS: 'COMMENTS',
        SOURCE_ID: 'SOURCE_ID',
        SOURCE_DESCRIPTION: 'SOURCE_DESCRIPTION',
        UTM_SOURCE: 'UTM_SOURCE',
        UTM_MEDIUM: 'UTM_MEDIUM',
        UTM_CAMPAIGN: 'UTM_CAMPAIGN'
    },

    // Source IDs for different form types
    sources: {
        CLIENT_FORM: 'WEB',
        CONTACT_SECTION: 'WEB',
        CALCULATOR: 'WEB'
    },

    // Error messages
    errors: {
        NO_CONFIG: 'No Bitrix24 configuration found',
        WEBHOOK_MISSING: 'BITRIX24_WEBHOOK_URL is not set',
        API_CONFIG_MISSING: 'Bitrix24 API configuration is incomplete',
        REQUEST_FAILED: 'Failed to create Bitrix24 lead'
    }
} as const

// Validate configuration
const hasWebhookConfig = !!bitrixConfig.webhookUrl
const hasApiConfig = !!(bitrixConfig.domain && bitrixConfig.userId && bitrixConfig.authToken)

if (!hasWebhookConfig && !hasApiConfig) {
    console.warn(bitrixConfig.errors.NO_CONFIG)
}

