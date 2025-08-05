'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, X, File, FileText, Image, FileArchive } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useDocumentUpload } from '@/hooks/use-document-upload'

interface DocumentUploadSectionProps {
  companyId?: string
  onDocumentsUploaded?: (documents: Array<{ name: string; file_path: string; file_size: number; mime_type: string }>) => void
  disabled?: boolean
}

interface UploadedFile {
  id: string
  name: string
  file: File
  size: number
  type: string
  status: 'uploading' | 'success' | 'error'
  progress?: number
  error?: string
}

export function DocumentUploadSection({ companyId, onDocumentsUploaded, disabled = false }: DocumentUploadSectionProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { uploadDocument, uploadProgress, isUploading, getProgress } = useDocumentUpload()

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    // Vérifier la taille des fichiers (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`Le fichier ${file.name} est trop volumineux (max 50MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Ajouter les fichiers à la liste
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Uploader les fichiers vers Supabase
    for (const file of newFiles) {
      await uploadFile(file)
    }
  }

  const uploadFile = async (file: UploadedFile) => {
    try {
      const result = await uploadDocument(file.file, companyId)
      
      if (result.success && result.data) {
        // Mettre à jour le statut du fichier
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'success', progress: 100 } 
              : f
          )
        )

        // Notifier le parent
        const allFiles = uploadedFiles.map(f => f.id === file.id ? { ...f, status: 'success' } : f)
        const successfulFiles = allFiles.filter(f => f.status === 'success')
        
        if (successfulFiles.length > 0) {
          const uploadedDocuments = successfulFiles.map(f => ({
            name: f.name,
            file_path: f.file.name, // Utiliser le nom du fichier pour l'instant
            file_size: f.size,
            mime_type: f.type
          }))
          onDocumentsUploaded?.(uploadedDocuments)
        }

        toast.success(`Document ${file.name} uploadé avec succès`)
      } else {
        // Marquer comme erreur
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'error', error: result.error } 
              : f
          )
        )
        toast.error(`Erreur lors de l'upload de ${file.name}: ${result.error}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'error', error: errorMessage } 
            : f
        )
      )
      toast.error(`Erreur lors de l'upload de ${file.name}: ${errorMessage}`)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    
    if (files.length > 0) {
      const input = fileInputRef.current
      if (input) {
        input.files = event.dataTransfer.files as any
        await handleFileSelect({ target: { files: event.dataTransfer.files } } as any)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Documents de l'entreprise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone de drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled 
              ? 'border-muted bg-muted/50 cursor-not-allowed' 
              : 'border-primary/50 hover:border-primary cursor-pointer'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Glissez-déposez vos documents ici ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, images, documents Word/Excel (max 50MB par fichier)
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* Liste des fichiers uploadés */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Documents uploadés</Label>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'uploading' && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">{file.progress}%</span>
                      </div>
                    )}
                    
                    {file.status === 'success' && (
                      <Badge variant="secondary" className="text-xs">
                        Terminé
                      </Badge>
                    )}
                    
                    {file.status === 'error' && (
                      <Badge variant="destructive" className="text-xs">
                        Erreur
                      </Badge>
                    )}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informations */}
        <div className="text-xs text-muted-foreground">
          <p>• Formats acceptés : PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, WEBP</p>
          <p>• Taille maximale : 50MB par fichier</p>
          <p>• Les documents seront associés à cette entreprise</p>
        </div>
      </CardContent>
    </Card>
  )
} 