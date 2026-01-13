import multer from 'multer'
import { Request } from 'express'

// Configure multer for memory storage
const storage = multer.memoryStorage()

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Неподдерживаемый тип файла. Разрешены: PDF, DOC, DOCX, TXT, JPG, PNG'))
    }
}

// Multer configuration
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
        files: 1 // Only one file per request
    }
})

// Error handler for multer
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Размер файла превышает максимально допустимый (20 МБ)'
            })
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Можно загрузить только один файл'
            })
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Неожиданное поле файла'
            })
        }
    }

    if (error.message.includes('Неподдерживаемый тип файла')) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }

    next(error)
}





