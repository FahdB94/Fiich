import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

interface UploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface UploadedDocument {
  id: string
  name: string
  file_path: string
  file_size: number
  mime_type: string
  company_id?: string
}

export function useDocumentUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuth()

  const uploadDocument = async (
    file: File,
    companyId?: string
  ): Promise<{ success: boolean; data?: UploadedDocument; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    const fileId = Math.random().toString(36).substr(2, 9)
    
    // Initialiser le progrès
    setUploadProgress(prev => [...prev, { fileId, progress: 0, status: 'uploading' }])
    setIsUploading(true)

    try {
      // Vérifier la taille du fichier
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        throw new Error('Fichier trop volumineux (max 50MB)')
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}-${file.name}`
      const filePath = `companies/${companyId || 'temp'}/${fileName}`

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Mettre à jour le progrès
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileId === fileId 
            ? { ...p, progress: 100, status: 'success' }
            : p
        )
      )

      // Créer l'enregistrement dans la base de données
      const documentData = {
        company_id: companyId,
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        is_public: false
      }

      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single()

      if (dbError) {
        throw new Error(dbError.message)
      }

      setIsUploading(false)
      
      return {
        success: true,
        data: {
          id: dbData.id,
          name: dbData.name,
          file_path: dbData.file_path,
          file_size: dbData.file_size,
          mime_type: dbData.mime_type,
          company_id: dbData.company_id
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      setUploadProgress(prev => 
        prev.map(p => 
          p.fileId === fileId 
            ? { ...p, status: 'error', error: errorMessage }
            : p
        )
      )
      
      setIsUploading(false)
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const uploadMultipleDocuments = async (
    files: File[],
    companyId?: string
  ): Promise<{ success: boolean; data?: UploadedDocument[]; errors?: string[] }> => {
    const results = await Promise.all(
      files.map(file => uploadDocument(file, companyId))
    )

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    return {
      success: failed.length === 0,
      data: successful.map(r => r.data!),
      errors: failed.map(r => r.error!)
    }
  }

  const clearProgress = () => {
    setUploadProgress([])
  }

  const getProgress = (fileId: string) => {
    return uploadProgress.find(p => p.fileId === fileId)
  }

  return {
    uploadDocument,
    uploadMultipleDocuments,
    uploadProgress,
    isUploading,
    clearProgress,
    getProgress
  }
} 