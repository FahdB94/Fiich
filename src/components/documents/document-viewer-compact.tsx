'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { File, FileText, Image, FileArchive, Download, Eye, Trash2, MoreVertical } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Document {
  id: string
  name: string
  file_path: string
  mime_type: string
  file_size: number
  document_type?: string
  created_at: string
}

interface DocumentViewerCompactProps {
  companyId: string
}

export function DocumentViewerCompact({ companyId }: DocumentViewerCompactProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDocuments()
  }, [companyId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération documents:', error)
        toast.error('Erreur lors du chargement des documents')
        return
      }

      setDocuments(data || [])
    } catch (error) {
      console.error('Erreur générale:', error)
      toast.error('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

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

  const getTypeBadgeColor = (type?: string) => {
    switch (type) {
      case 'rib': return 'bg-blue-100 text-blue-800'
      case 'kbis': return 'bg-green-100 text-green-800'
      case 'contrat': return 'bg-purple-100 text-purple-800'
      case 'facture': return 'bg-orange-100 text-orange-800'
      case 'devis': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleView = async (doc: Document) => {
    try {
      const filePath = doc.file_path
      
      const { data, error } = await supabase.storage
        .from('company-files')
        .createSignedUrl(filePath, 60)
      
      if (error) {
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-files/${filePath}`
        window.open(publicUrl, "_blank")
        return
      }
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      } else {
        toast.error('Impossible d\'ouvrir le document')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture:', error)
      toast.error('Erreur lors de l\'ouverture du document')
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const filePath = doc.file_path
      
      const { data, error } = await supabase.storage
        .from('company-files')
        .createSignedUrl(filePath, 60)
      
      if (error) {
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-files/${filePath}`
        const link = document.createElement('a')
        link.href = publicUrl
        link.download = doc.name || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      
      if (data?.signedUrl) {
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = doc.name || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast.error('Impossible de télécharger le document')
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      toast.error('Erreur lors du téléchargement')
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return
    }

    try {
      const { error: storageError } = await supabase.storage
        .from('company-files')
        .remove([doc.file_path])

      if (storageError) {
        toast.error('Erreur lors de la suppression du fichier')
        return
      }

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)

      if (dbError) {
        toast.error('Erreur lors de la suppression du document')
        return
      }

      toast.success('Document supprimé avec succès')
      fetchDocuments()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents de l'entreprise</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Chargement des documents...</p>
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents de l'entreprise</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucun document trouvé pour cette entreprise.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents de l'entreprise ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
            >
              {/* Icône et informations principales */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(doc.mime_type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    {doc.document_type && (
                      <Badge className={`${getTypeBadgeColor(doc.document_type)} text-xs`}>
                        {doc.document_type.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(doc)}
                  title="Voir le document"
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  title="Télécharger"
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(doc)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(doc)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 