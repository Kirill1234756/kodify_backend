import fs from 'fs/promises'
import path from 'path'
import { STORAGE_CONFIG } from '../config/database'

export class FileStorageService {
    /**
     * Upload file from memory buffer to disk storage
     * @param file - Multer file object (from memory storage)
     * @returns Object with url, fileName, and fileSize
     */
    static async uploadFile(file: Express.Multer.File): Promise<{
        url: string
        fileName: string
        fileSize: number
    }> {
        // Ensure upload directory exists
        await this.ensureUploadDirExists()

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const originalName = file.originalname || 'file'
        const ext = path.extname(originalName)
        const baseName = path.basename(originalName, ext)
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_')
        const fileName = `${sanitizedBaseName}_${timestamp}_${randomString}${ext}`
        const filePath = path.join(STORAGE_CONFIG.UPLOAD_DIR, fileName)

        // Write file to disk
        await fs.writeFile(filePath, file.buffer)

        // Generate public URL
        const url = `${STORAGE_CONFIG.PUBLIC_URL}/uploads/${fileName}`

        return {
            url,
            fileName,
            fileSize: file.size
        }
    }

    /**
     * Get file path from URL
     * @param url - Public URL of the file
     * @returns File path or null if URL is invalid
     */
    static getFilePathFromUrl(url: string | null | undefined): string | null {
        if (!url) {
            return null
        }

        try {
            // Extract filename from URL
            // URL format: http://localhost:3000/uploads/filename.ext
            const urlObj = new URL(url)
            const pathname = urlObj.pathname

            // Check if path starts with /uploads/
            if (!pathname.startsWith('/uploads/')) {
                return null
            }

            // Extract filename
            const fileName = pathname.replace('/uploads/', '')
            
            // Validate filename (security check)
            if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
                return null
            }

            // Return full file path
            return path.join(STORAGE_CONFIG.UPLOAD_DIR, fileName)
        } catch (error) {
            console.error('Error parsing file URL:', error)
            return null
        }
    }

    /**
     * Delete file from disk
     * @param filePath - Full path to the file
     */
    static async deleteFile(filePath: string): Promise<void> {
        try {
            // Security check: ensure file is within upload directory
            const normalizedFilePath = path.normalize(filePath)
            const normalizedUploadDir = path.normalize(STORAGE_CONFIG.UPLOAD_DIR)

            if (!normalizedFilePath.startsWith(normalizedUploadDir)) {
                throw new Error('File path is outside upload directory')
            }

            await fs.unlink(filePath)
        } catch (error: any) {
            // Ignore file not found errors
            if (error.code !== 'ENOENT') {
                console.error('Error deleting file:', error)
                throw error
            }
        }
    }

    /**
     * Ensure upload directory exists
     */
    private static async ensureUploadDirExists(): Promise<void> {
        try {
            await fs.access(STORAGE_CONFIG.UPLOAD_DIR)
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // Directory doesn't exist, create it
                await fs.mkdir(STORAGE_CONFIG.UPLOAD_DIR, { recursive: true })
            } else {
                throw error
            }
        }
    }
}
