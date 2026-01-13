// Rate limiting (отключено, если нет express-rate-limit)
export const generalRateLimit = (req: any, res: any, next: any) => next()

// Ниже были нерабочие экспорты (createRateLimit отсутствует)
// Если понадобится limiter — вернуть и реализовать функцию
// export const formRateLimit = createRateLimit(...)
// export const validationRateLimit = createRateLimit(...)
// export const suspiciousActivityLimit = createRateLimit(...)





