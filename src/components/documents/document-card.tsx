'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Globe,
  Lock,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Document } from '@/lib/types'
import { formatFileSize, getFileTypeIcon } from '@/lib/file-utils'

interface DocumentCardProps {
  document: Document
  onView?: (document: Document) => void
  onDownload?: (document: Document) => void
  onEdit?: (document: Document) => void
  onDelete?: (document: Document) => void
  onRename?: (document: Document, newName: string) => void
  onToggleVisibility?: (document: Document, isPublic: boolean) => void
  className?: string
}

const getDocumentFormatLabel = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('image')) return 'Image'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Document'
  return 'Fichier'
}

const getDocumentFormatColor = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'bg-red-100 text-red-800'
  if (mimeType.includes('image')) return 'bg-green-100 text-green-800'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'bg-blue-100 text-blue-800'
  return 'bg-gray-100 text-gray-800'
}

export function DocumentCard({ 
  document, 
  onView, 
  onDownload, 
  onEdit, 
  onDelete,
  onRename,
  onToggleVisibility,
  className 
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(document.display_name || document.name || "")
  const { toast } = useToast()

  const handleView = () => {
    if (onView) {
      onView(document)
    }
  }

  const handleDownload = async () => {
    if (onDownload) {
      try {
        await onDownload(document)
        toast.success('Téléchargement démarré')
      } catch (error) {
        toast.error('Erreur lors du téléchargement')
      }
    }
  }

  const handleEditExternal = () => {
    if (onEdit) {
      onEdit(document)
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      try {
        setIsDeleting(true)
        await onDelete(document)
        toast.success('Document supprimé')
      } catch (error) {
        toast.error('Erreur lors de la suppression')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditName(document.display_name || document.name || "")
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error('Le nom ne peut pas être vide')
      return
    }

    if (onRename) {
      try {
        await onRename(document, editName.trim())
        setIsEditing(false)
        toast.success('Document renommé')
      } catch (error) {
        toast.error('Erreur lors du renommage')
      }
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(document.display_name || document.name || "")
  }

  const handleToggleVisibility = async () => {
    if (onToggleVisibility) {
      try {
        await onToggleVisibility(document, !document.is_public)
        toast.success(`Document ${!document.is_public ? 'public' : 'privé'}`)
      } catch (error) {
        toast.error('Erreur lors du changement de statut')
      }
    }
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-3xl flex-shrink-0">
              {getFileTypeIcon(document.name)}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit()
                      } else if (e.key === 'Escape') {
                        handleCancelEdit()
                      }
                    }}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleSaveEdit}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <CardTitle 
                  className="text-sm truncate max-w-32 cursor-pointer hover:text-blue-600" 
                  title={document.display_name || document.name || "Document"}
                  onClick={handleEdit}
                >
                  {document.display_name || document.name || "Document"}
                </CardTitle>
              )}
              <div className="flex items-center gap-1 mt-1 min-w-0 overflow-hidden">
                <div className={`${getDocumentFormatColor(document.mime_type)} text-xs px-2 py-0.5 rounded-md border truncate max-w-16 flex-shrink-0`}>
                  {getDocumentFormatLabel(document.mime_type)}
                </div>
                <button
                  onClick={handleToggleVisibility}
                  className={`text-xs px-2 py-0.5 rounded-md border border-input bg-background text-foreground max-w-24 whitespace-nowrap flex-shrink-0 hover:bg-accent transition-colors ${
                    document.is_public ? 'text-green-600' : 'text-orange-600'
                  }`}
                  title={`Cliquer pour rendre ${document.is_public ? 'privé' : 'public'}`}
                >
                  {document.is_public ? (
                    <>
                      <Globe className="h-3 w-3 mr-1 inline" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1 inline" />
                      Privé
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" />
                Visualiser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Renommer
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => e.preventDefault()} 
                className="text-destructive focus:text-destructive"
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="flex items-center w-full">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Suppression...' : 'Supprimer'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-center justify-between">
            <span>Taille</span>
            <span className="font-medium">{formatFileSize(document.file_size)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Format</span>
            <span className="font-medium uppercase">{document.mime_type.split('/')[1]}</span>
          </div>
          {document.document_type && (
            <div className="flex items-center justify-between">
              <span>Type de document</span>
              <span className="font-medium">{document.document_type}</span>
            </div>
          )}
          {document.document_version && (
            <div className="flex items-center justify-between">
              <span>Version</span>
              <span className="font-medium">{document.document_version}</span>
            </div>
          )}
          {document.document_reference && (
            <div className="flex items-center justify-between">
              <span>Référence</span>
              <span className="font-medium text-xs truncate max-w-24" title={document.document_reference}>
                {document.document_reference}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Ajouté le</span>
            <span className="font-medium">
              {format(new Date(document.created_at), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleView}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
