import { toast } from 'sonner'

// Types pour les erreurs
export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

export interface ValidationError {
  field: string
  message: string
}

// Classe d'erreur personnalisée
export class AppError extends Error {
  public readonly code: string
  public readonly status: number
  public readonly isOperational: boolean

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, isOperational: boolean = true) {
    super(message)
    this.code = code
    this.status = status
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// Gestionnaire d'erreurs centralisé
export class ErrorHandler {
  // Gestion des erreurs Supabase
  static handleSupabaseError(error: any): AppError {
    if (!error) return new AppError('Erreur inconnue', 'UNKNOWN_ERROR', 500)

    // Erreurs d'authentification
    if (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid email or password')) {
      return new AppError('Email ou mot de passe incorrect', 'INVALID_CREDENTIALS', 401)
    }

    if (error.message?.includes('Email not confirmed')) {
      return new AppError('Veuillez vérifier votre email avant de vous connecter', 'EMAIL_NOT_CONFIRMED', 401)
    }

    if (error.message?.includes('User already registered')) {
      return new AppError('Cet email est déjà utilisé', 'USER_ALREADY_EXISTS', 409)
    }

    // Erreurs de permissions
    if (error.message?.includes('permission denied') || error.code === 'PGRST301') {
      return new AppError('Vous n\'avez pas les permissions pour cette action', 'PERMISSION_DENIED', 403)
    }

    // Erreurs de contraintes de base de données
    if (error.code === '23505') {
      return new AppError('Cette ressource existe déjà', 'DUPLICATE_RESOURCE', 409)
    }

    if (error.code === '23503') {
      return new AppError('Référence invalide dans les données', 'FOREIGN_KEY_VIOLATION', 400)
    }

    // Erreurs réseau
    if (error.message?.includes('fetch')) {
      return new AppError('Erreur de connexion au serveur', 'NETWORK_ERROR', 500)
    }

    // Erreur générique
    return new AppError(
      error.message || 'Une erreur est survenue',
      error.code || 'SUPABASE_ERROR',
      error.status || 500
    )
  }

  // Gestion des erreurs de validation
  static handleValidationError(errors: any[]): ValidationError[] {
    return errors.map(error => ({
      field: error.path?.join('.') || 'unknown',
      message: error.message || 'Erreur de validation'
    }))
  }

  // Gestion des erreurs de fichier
  static handleFileError(error: any): AppError {
    if (error.message?.includes('file size')) {
      return new AppError('Le fichier est trop volumineux (max 10MB)', 'FILE_TOO_LARGE', 400)
    }

    if (error.message?.includes('file type')) {
      return new AppError('Type de fichier non supporté', 'UNSUPPORTED_FILE_TYPE', 400)
    }

    if (error.message?.includes('upload')) {
      return new AppError('Erreur lors de l\'upload du fichier', 'UPLOAD_ERROR', 500)
    }

    return new AppError('Erreur lors du traitement du fichier', 'FILE_ERROR', 500)
  }

  // Affichage des erreurs à l'utilisateur
  static showError(error: Error | AppError | string, context?: string) {
    let message = ''
    let title = 'Erreur'

    if (typeof error === 'string') {
      message = error
    } else if (error instanceof AppError) {
      message = error.message
      if (error.status >= 500) {
        title = 'Erreur du serveur'
      } else if (error.status >= 400) {
        title = 'Erreur de validation'
      }
    } else {
      message = error.message || 'Une erreur inattendue est survenue'
    }

    // Ajouter le contexte si fourni
    if (context) {
      title = `${title} - ${context}`
    }

    toast.error(message, {
      description: context,
      duration: 5000,
    })

    // Log pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error)
      console.error('Context:', context)
    }
  }

  // Affichage des succès
  static showSuccess(message: string, description?: string) {
    toast.success(message, {
      description,
      duration: 3000,
    })
  }

  // Affichage d'informations
  static showInfo(message: string, description?: string) {
    toast.info(message, {
      description,
      duration: 4000,
    })
  }

  // Vérification si une erreur est opérationnelle
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational
    }
    return false
  }
}

// Wrapper pour les appels API
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await apiCall()
  } catch (error) {
    const appError = ErrorHandler.handleSupabaseError(error)
    ErrorHandler.showError(appError, context)
    return null
  }
}

// Hook pour la gestion d'erreurs dans les composants
export function useErrorHandler() {
  return {
    handleError: (error: Error | string, context?: string) => {
      ErrorHandler.showError(error, context)
    },
    showSuccess: (message: string, description?: string) => {
      ErrorHandler.showSuccess(message, description)
    },
    showInfo: (message: string, description?: string) => {
      ErrorHandler.showInfo(message, description)
    },
    withErrorHandling
  }
}