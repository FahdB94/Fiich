'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, SortAsc, SortDesc, FileText, Grid, List } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { DocumentCard } from './document-card'
import { Document } from '@/lib/types'

interface DocumentListProps {
  documents: Document[]
  onView?: (document: Document) => void
  onDownload?: (document: Document) => void
  onEdit?: (document: Document) => void
  onDelete?: (document: Document) => void
  loading?: boolean
  className?: string
}

type SortField = 'name' | 'created_at' | 'file_size' | 'mime_type'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

const mimeTypeLabels: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/': 'Image',
  'text/': 'Texte',
  'application/': 'Document'
}

const documentTypeLabels: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'Image JPEG',
  'image/png': 'Image PNG',
  'image/': 'Image',
  'text/': 'Document texte',
  'application/msword': 'Document Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Document Word'
}

export function DocumentList({
  documents,
  onView,
  onDownload,
  onEdit,
  onDelete,
  loading = false,
  className
}: DocumentListProps) {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMimeTypes, setSelectedMimeTypes] = useState<string[]>([])
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        (doc.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.mime_type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Mime type filter
    if (selectedMimeTypes.length > 0) {
      filtered = filtered.filter(doc => 
        selectedMimeTypes.some(mimeType => doc.mime_type.includes(mimeType))
      )
    }

    // Public filter
    if (showPublicOnly) {
      filtered = filtered.filter(doc => doc.is_public)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'name':
          aValue = (a.name || "").toLowerCase()
          bValue = (b.name || "").toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'file_size':
          aValue = a.file_size
          bValue = b.file_size
          break
        case 'mime_type':
          aValue = a.mime_type
          bValue = b.mime_type
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [documents, searchQuery, selectedMimeTypes, showPublicOnly, sortField, sortOrder])

    const toggleMimeTypeFilter = (mimeType: string) => {
    setSelectedMimeTypes(prev => 
      prev.includes(mimeType) 
        ? prev.filter(t => t !== mimeType)
        : [...prev, mimeType]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedMimeTypes([])
    setShowPublicOnly(false)
  }

  const hasActiveFilters = searchQuery || selectedMimeTypes.length > 0 || showPublicOnly

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
              {documents.length > 0 && (
                <Badge variant="secondary">
                  {filteredDocuments.length}/{documents.length}
                </Badge>
              )}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                  {hasActiveFilters && (
                    <Badge className="ml-2 h-4 w-4 p-0 text-xs">!</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Types de documents</DropdownMenuLabel>
                {Object.entries(mimeTypeLabels).map(([type, label]) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedMimeTypes.includes(type)}
                    onCheckedChange={() => toggleMimeTypeFilter(type)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showPublicOnly}
                  onCheckedChange={setShowPublicOnly}
                >
                  Documents publics uniquement
                </DropdownMenuCheckboxItem>
                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearFilters}>
                      Effacer les filtres
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4 mr-2" />
                  ) : (
                    <SortDesc className="h-4 w-4 mr-2" />
                  )}
                  Tri
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSortField('name')}>
                  Nom {sortField === 'name' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortField('created_at')}>
                  Date {sortField === 'created_at' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortField('file_size')}>
                  Taille {sortField === 'file_size' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortField('mime_type')}>
                  Type {sortField === 'mime_type' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder('asc')}>
                  Croissant {sortOrder === 'asc' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('desc')}>
                  Décroissant {sortOrder === 'desc' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {documents.length === 0 ? 'Aucun document' : 'Aucun résultat'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {documents.length === 0
                ? 'Commencez par téléverser votre premier document.'
                : 'Essayez de modifier vos filtres de recherche.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          }>
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onView={onView}
                onDownload={onDownload}
                onEdit={onEdit}
                onDelete={onDelete}
                className={viewMode === 'list' ? 'flex flex-row items-center' : ''}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}