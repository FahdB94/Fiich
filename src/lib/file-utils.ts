import { v4 as uuidv4 } from 'uuid'
import { appConfig } from './config'

/**
 * Generate a unique file name with timestamp and UUID
 */
export function generateFileName(originalName: string): string {
  const timestamp = new Date().getTime()
  const uuid = uuidv4().split('-')[0]
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "")
  const sanitizedName = nameWithoutExt.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
  
  return `${timestamp}-${uuid}-${sanitizedName}.${extension}`
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > appConfig.maxFileSize) {
    return {
      isValid: false,
      error: `Le fichier ne peut pas dépasser ${formatFileSize(appConfig.maxFileSize)}`
    }
  }

  // Check file type
  if (!appConfig.allowedFileTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Type de fichier non supporté'
    }
  }

  return { isValid: true }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Get file type icon based on extension
 */
export function getFileTypeIcon(filename: string): string {
  const extension = getFileExtension(filename)
  
  switch (extension) {
    case 'pdf':
      return '📄'
    case 'jpg':
    case 'jpeg':
    case 'png':
      return '🖼️'
    case 'doc':
    case 'docx':
      return '📝'
    default:
      return '📁'
  }
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

/**
 * Download file from URL
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Create blob URL from file
 */
export function createBlobUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Revoke blob URL
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url)
}