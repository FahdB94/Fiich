'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

import { DocumentUpload } from './document-upload'
import { DocumentList } from './document-list'
import { DocumentViewer } from './document-viewer'
import { useDocuments } from '@/hooks/use-documents'
import { Document } from '@/lib/types'

interface DocumentManagerProps {
  companyId: string
  className?: string
}

export function DocumentManager({ companyId, className }: DocumentManagerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const { toast } = useToast()

  const {
    documents,
    loading,
    error,
    uploadDocument,
    updateDocument,
    deleteDocument,
    getDocumentUrl,
    refetch
  } = useDocuments(companyId)

  const handleUploadSuccess = () => {
    toast.success('Document téléversé avec succès')
    refetch()
    setActiveTab('list') // Switch to list after upload
  }

  const handleView = async (document: Document) => {
    setSelectedDocument(document)
    setShowViewer(true)
  }

  const handleDownload = async (document: Document) => {
    try {
      const { url, error } = await getDocumentUrl(document.id, true)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Téléchargement démarré')
      }
    } catch (error) {
      toast.error('Erreur lors du téléchargement')
    }
  }

  const handleEdit = (document: Document) => {
    // TODO: Implement edit functionality
    toast.info('Fonction d\'édition à venir')
  }

  const handleDelete = async (document: Document) => {
    try {
      const { error } = await deleteDocument(document.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Document supprimé')
        refetch()
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const stats = {
    total: documents.length,
    public: documents.filter(doc => doc.is_public).length,
    private: documents.filter(doc => !doc.is_public).length,
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">
          Erreur lors du chargement des documents: {error}
        </div>
        <Button onClick={refetch} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              Mes documents
              {stats.total > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stats.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upload">
              Téléverser
            </TabsTrigger>
          </TabsList>

          {/* Quick Stats */}
          {stats.total > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {stats.public} public{stats.public > 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline">
                {stats.private} privé{stats.private > 1 ? 's' : ''}
              </Badge>
              {documents.filter(doc => doc.mime_type.includes('pdf')).length > 0 && (
                <Badge variant="secondary">
                  {documents.filter(doc => doc.mime_type.includes('pdf')).length} PDF
                </Badge>
              )}
              {documents.filter(doc => doc.mime_type.includes('image')).length > 0 && (
                <Badge variant="secondary">
                  {documents.filter(doc => doc.mime_type.includes('image')).length} Images
                </Badge>
              )}
            </div>
          )}
        </div>

        <TabsContent value="list" className="space-y-6">
          <DocumentList
            documents={documents}
            onView={handleView}
            onDownload={handleDownload}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <DocumentUpload
            companyId={companyId}
            onUploadSuccess={handleUploadSuccess}
          />
        </TabsContent>
      </Tabs>

      {/* Document Viewer Dialog */}
      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <DocumentViewer
              companyId={companyId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}