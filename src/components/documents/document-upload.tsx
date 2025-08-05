'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, File, X, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { documentUploadSchema, DocumentUploadData } from '@/lib/validations'
import { validateFile, formatFileSize, getFileTypeIcon } from '@/lib/file-utils'
import { DocumentType } from '@/lib/types'
import { useDocuments } from '@/hooks/use-documents'

interface DocumentUploadProps {
  companyId: string
  onUploadSuccess?: () => void
  onUploadComplete?: (document: any) => void
}

const documentTypeLabels: Record<DocumentType, string> = {
  rib: 'RIB (Relevé d\'Identité Bancaire)',
  kbis: 'Kbis',
  contrat: 'Contrat',
  facture: 'Facture',
  devis: 'Devis',
  autre: 'Autre document'
}

export function DocumentUpload({ companyId, onUploadSuccess, onUploadComplete }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  
  // Use the real documents hook
  const { uploadDocument } = useDocuments(companyId)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<DocumentUploadData & { file?: File }>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      type: 'autre',
      is_public: false
    }
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error('Fichier non supporté ou trop volumineux')
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        const validation = validateFile(file)
        
        if (!validation.isValid) {
          toast.error(validation.error || 'Erreur de validation du fichier')
          return
        }

        setSelectedFiles([file])
        setValue('name', file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  })

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    reset()
  }

  const onSubmit = async (data: DocumentUploadData & { file?: File }) => {
    if (selectedFiles.length === 0) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }

    const file = selectedFiles[0]
    setUploading(true)
    setUploadProgress(0)

    try {
      // Start upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 15
        })
      }, 300)

      // Real upload using useDocuments hook
      const { data: document, error } = await uploadDocument(
        file, 
        data.type, 
        data.name, 
        data.is_public
      )
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (error) {
        throw new Error(error)
      }

      toast.success('Document téléversé avec succès')
      
      // Reset form
      setSelectedFiles([])
      reset()
      
      if (onUploadSuccess) onUploadSuccess()
      if (onUploadComplete && document) {
        onUploadComplete(document)
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du téléversement')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Téléverser un document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-primary">Déposez le fichier ici...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Glissez-déposez un fichier ou cliquez pour sélectionner
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, JPG, PNG, DOC, DOCX jusqu'à 10MB
              </p>
            </div>
          )}
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Fichier sélectionné :</Label>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileTypeIcon(file.name)}</span>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Form */}
        {selectedFiles.length > 0 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du document</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: RIB Société ABC"
                disabled={uploading}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Type de document</Label>
              <Select onValueChange={(value) => setValue('type', value as DocumentType)}>
                <SelectTrigger disabled={uploading}>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                {...register('is_public')}
                disabled={uploading}
              />
              <Label htmlFor="is_public" className="text-sm">
                Rendre ce document visible lors du partage
              </Label>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Téléversement en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={uploading} className="flex-1">
                {uploading ? 'Téléversement...' : 'Téléverser le document'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedFiles([])
                  reset()
                }}
                disabled={uploading}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Les documents téléversés sont stockés de manière sécurisée et ne sont accessibles qu'aux personnes autorisées.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}