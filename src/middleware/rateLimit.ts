/**
 * Simple rate limiting middleware
 * For production use, consider using express-rate-limit with Redis
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

interface RateLimitStore {
    [key: string]: {
        count: number
        resetTime: number
    }
}

// In-memory store (for production, use Redis)
const store: RateLimitStore = {}
const CLEANUP_INTERVAL = 60000 // Clean up expired entries every minute

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key]
        }
    })
}, CLEANUP_INTERVAL)

interface RateLimitOptions {
    windowMs: number // Time window in milliseconds
    max: number // Max requests per window
    message?: string
    skipSuccessfulRequests?: boolean
    skipFailedRequests?: boolean
}

function createRateLimit(options: RateLimitOptions) {
    const { windowMs, max, message = 'Too many requests, please try again later' } = options

    return (req: Request, res: Response, next: NextFunction) => {
        // Skip rate limiting in development if env var is set
        if (process.env.DISABLE_RATE_LIMIT === 'true') {
            return next()
        }

        const key = req.ip || req.socket.remoteAddress || 'unknown'
        const now = Date.now()

        // Get or create entry
        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 1,
                resetTime: now + windowMs
            }
            return next()
        }

        // Increment count
        store[key].count++

        // Check if limit exceeded
        if (store[key].count > max) {
            logger.warn(`Rate limit exceeded for IP: ${key}`)
            res.status(429).json({
                success: false,
                message,
                retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
            })
            return
        }

        next()
    }
}

// General rate limit: 100 requests per 15 minutes
export const generalRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
})

// Form submission rate limit: 10 requests per minute
export const formRateLimit = createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many form submissions, please try again later'
})

// Strict rate limit for suspicious activity: 3 requests per minute
export const strictRateLimit = createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3,
    message: 'Too many requests, please try again later'
})