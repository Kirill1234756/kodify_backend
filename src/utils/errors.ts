/**
 * Custom error classes and error handling utilities
 */

export class AppError extends Error {
    public readonly statusCode: number
    public readonly isOperational: boolean

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = isOperational

        Error.captureStackTrace(this, this.constructor)
        Object.setPrototypeOf(this, AppError.prototype)
    }
}

export class ValidationError extends AppError {
    constructor(message: string, public readonly errors?: Record<string, string>) {
        super(message, 400)
        Object.setPrototypeOf(this, ValidationError.prototype)
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404)
        Object.setPrototypeOf(this, NotFoundError.prototype)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401)
        Object.setPrototypeOf(this, UnauthorizedError.prototype)
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403)
        Object.setPrototypeOf(this, ForbiddenError.prototype)
    }
}

export class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error) {
        super(message, 500)
        if (originalError) {
            this.stack = originalError.stack
        }
        Object.setPrototypeOf(this, DatabaseError.prototype)
    }
}

/**
 * Handle errors and format response
 */
export function handleError(error: unknown): { message: string; statusCode: number; details?: any } {
    if (error instanceof AppError) {
        return {
            message: error.message,
            statusCode: error.statusCode,
            details: error instanceof ValidationError ? error.errors : undefined
        }
    }

    if (error instanceof Error) {
        return {
            message: error.message || 'Internal server error',
            statusCode: 500
        }
    }

    return {
        message: 'Internal server error',
        statusCode: 500
    }
}


