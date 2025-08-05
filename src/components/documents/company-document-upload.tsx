'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, X, File, FileText, Image, FileArchive, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DocumentType } from '@/lib/types'

interface CompanyDocumentUploadProps {
  onDocumentsChange: (documents: PendingDocument[]) => void
  disabled?: boolean
}

export interface PendingDocument {
  id: string
  file: File
  name: string
  type: DocumentType
  size: number
  mime_type: string
}



const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  { value: 'rib', label: 'RIB/IBAN', description: 'Relevé d\'identité bancaire' },
  { value: 'kbis', label: 'KBIS', description: 'Extrait Kbis de l\'entreprise' },
  { value: 'contrat', label: 'Contrat', description: 'Contrat commercial ou de service' },
  { value: 'facture', label: 'Facture', description: 'Facture ou bon de commande' },
  { value: 'devis', label: 'Devis', description: 'Devis ou proposition commerciale' },
  { value: 'autre', label: 'Autre', description: 'Autre type de document' },
]

export function CompanyDocumentUpload({ onDocumentsChange, disabled = false }: CompanyDocumentUploadProps) {
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Ajouter les fichiers à la liste avec type par défaut
    const newDocuments: PendingDocument[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      type: 'autre', // Type par défaut
      size: file.size,
      mime_type: file.type
    }))

    const updatedDocuments = [...pendingDocuments, ...newDocuments]
    setPendingDocuments(updatedDocuments)
    onDocumentsChange(updatedDocuments)

    toast.success(`${validFiles.length} document(s) ajouté(s)`)
  }

  const updateDocumentType = (documentId: string, type: DocumentType) => {
    const updatedDocuments = pendingDocuments.map(doc => 
      doc.id === documentId ? { ...doc, type } : doc
    )
    setPendingDocuments(updatedDocuments)
    onDocumentsChange(updatedDocuments)
  }

  const removeDocument = (documentId: string) => {
    const updatedDocuments = pendingDocuments.filter(doc => doc.id !== documentId)
    setPendingDocuments(updatedDocuments)
    onDocumentsChange(updatedDocuments)
    toast.success('Document supprimé')
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    
    if (files.length > 0) {
      const input = fileInputRef.current
      if (input) {
        input.files = event.dataTransfer.files as any
        handleFileSelect({ target: { files: event.dataTransfer.files } } as any)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const getTypeBadgeColor = (type: DocumentType) => {
    switch (type) {
      case 'rib': return 'bg-blue-100 text-blue-800'
      case 'kbis': return 'bg-green-100 text-green-800'
      case 'contrat': return 'bg-purple-100 text-purple-800'
      case 'facture': return 'bg-orange-100 text-orange-800'
      case 'devis': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

        {/* Liste des documents en attente */}
        {pendingDocuments.length > 0 && (
          <div className="space-y-3">
            <Label>Documents à uploader ({pendingDocuments.length})</Label>
            <div className="space-y-3">
              {pendingDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(document.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{document.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(document.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Sélecteur de type */}
                    <Select
                      value={document.type}
                      onValueChange={(value: DocumentType) => updateDocumentType(document.id, value)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{type.label}</span>
                              <span className="text-xs text-muted-foreground">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Badge de type */}
                    <Badge className={getTypeBadgeColor(document.type)}>
                      {DOCUMENT_TYPES.find(t => t.value === document.type)?.label}
                    </Badge>
                    
                    {/* Bouton supprimer */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(document.id)}
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
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Formats acceptés : PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, WEBP</p>
          <p>• Taille maximale : 50MB par fichier</p>
          <p>• Les documents seront uploadés après création de l'entreprise</p>
          <p>• Sélectionnez le type de chaque document pour une meilleure organisation</p>
        </div>
      </CardContent>
    </Card>
  )
} 