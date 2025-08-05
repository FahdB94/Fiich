'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { File, FileText, Image, FileArchive, Download, Eye, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface Document {
  id: string
  name: string
  file_path: string
  mime_type: string
  file_size: number
  document_type?: string
  created_at: string
}

interface DocumentViewerProps {
  companyId: string
}

export function DocumentViewer({ companyId }: DocumentViewerProps) {
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
      console.log('🔍 Tentative d\'ouverture du document:', doc.file_path)
      
      // Utiliser directement le chemin du fichier
      const filePath = doc.file_path
      console.log('📁 Chemin du fichier:', filePath)
      
      // Créer l'URL signée
      const { data, error } = await supabase.storage
        .from('company-files')
        .createSignedUrl(filePath, 60)
      
      if (error) {
        console.log("🔄 Tentative avec URL publique...")
        // Construire l'URL publique
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-files/${filePath}`
        console.log("🔗 URL publique:", publicUrl)
        window.open(publicUrl, "_blank")
        return
      }
      
      if (data?.signedUrl) {
        console.log('URL signée générée:', data.signedUrl)
        window.open(data.signedUrl, '_blank')
      } else {
        console.error('URL signée non générée')
        toast.error('Impossible d\'ouvrir le document')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture:', error)
      toast.error('Erreur lors de l\'ouverture du document')
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      console.log('🔍 Tentative de téléchargement du document:', doc.file_path)
      
      // Utiliser directement le chemin du fichier
      const filePath = doc.file_path
      console.log('📁 Chemin du fichier:', filePath)
      
      // Créer l'URL signée
      const { data, error } = await supabase.storage
        .from('company-files')
        .createSignedUrl(filePath, 60)
      
      if (error) {
        console.log("🔄 Tentative avec URL publique...")
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
        console.log('URL signée générée:', data.signedUrl)
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = doc.name || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        console.error('URL signée non générée')
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
      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('company-files')
        .remove([doc.file_path])

      if (storageError) {
        console.error('Erreur suppression fichier:', storageError)
        toast.error('Erreur lors de la suppression du fichier')
        return
      }

      // Supprimer l'enregistrement de la base
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)

      if (dbError) {
        console.error('Erreur suppression enregistrement:', dbError)
        toast.error('Erreur lors de la suppression du document')
        return
      }

      toast.success('Document supprimé avec succès')
      fetchDocuments() // Recharger la liste
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
            <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(doc.mime_type)}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {doc.document_type && (
                  <Badge className={`${getTypeBadgeColor(doc.document_type)} hidden sm:inline-flex`}>
                    {doc.document_type.toUpperCase()}
                  </Badge>
                )}
                
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
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc)}
                  title="Supprimer"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        </CardContent>
      </Card>
  )
}