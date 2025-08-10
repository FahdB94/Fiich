import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './use-toast'
import { PendingDocument } from '@/components/documents/company-document-upload'

interface UploadProgress {
  documentId: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function useCompanyDocuments() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const uploadCompanyDocuments = async (
    documents: PendingDocument[],
    companyId: string
  ): Promise<{ success: boolean; uploadedCount: number; errors: string[] }> => {
    if (documents.length === 0) {
      return { success: true, uploadedCount: 0, errors: [] }
    }

    setIsUploading(true)
    const errors: string[] = []
    let uploadedCount = 0

    // Initialiser le progrès pour tous les documents
    setUploadProgress(
      documents.map(doc => ({
        documentId: doc.id,
        progress: 0,
        status: 'uploading' as const
      }))
    )

    for (const document of documents) {
      try {
        // Valider le type MIME (pdf/jpg/jpeg/png uniquement)
        const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!allowed.includes(document.mime_type)) {
          throw new Error('Type de fichier non autorisé')
        }

        // Générer un nom de fichier unique (sans espaces)
        const timestamp = Date.now()
        const sanitizedName = document.name.replace(/\s+/g, '_')
        const fileName = `${timestamp}-${sanitizedName}`
        // Nouveau schéma: {company_id}/{category}/{uuid-filename.ext}
        const filePath = `${companyId}/${document.type}/${fileName}`

        // Upload vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-files')
          .upload(filePath, document.file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        // Mettre à jour le progrès
        setUploadProgress(prev => 
          prev.map(p => 
            p.documentId === document.id 
              ? { ...p, progress: 50, status: 'uploading' }
              : p
          )
        )

        // Créer l'enregistrement dans la base de données
        const documentData = {
          company_id: companyId,
          name: document.name,
          file_path: filePath,
          file_size: document.size,
          mime_type: document.mime_type,
          document_type: document.type,
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

        // Marquer comme succès
        setUploadProgress(prev => 
          prev.map(p => 
            p.documentId === document.id 
              ? { ...p, progress: 100, status: 'success' }
              : p
          )
        )

        uploadedCount++
        toast.success(`Document ${document.name} uploadé avec succès`)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        errors.push(`${document.name}: ${errorMessage}`)
        
        // Marquer comme erreur
        setUploadProgress(prev => 
          prev.map(p => 
            p.documentId === document.id 
              ? { ...p, status: 'error', error: errorMessage }
              : p
          )
        )

        toast.error(`Erreur lors de l'upload de ${document.name}: ${errorMessage}`)
      }
    }

    setIsUploading(false)

    return {
      success: errors.length === 0,
      uploadedCount,
      errors
    }
  }

  const clearProgress = () => {
    setUploadProgress([])
  }

  const getProgress = (documentId: string) => {
    return uploadProgress.find(p => p.documentId === documentId)
  }

  return {
    uploadCompanyDocuments,
    uploadProgress,
    isUploading,
    clearProgress,
    getProgress
  }
} 