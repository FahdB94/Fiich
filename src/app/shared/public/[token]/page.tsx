'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, FileText, Download, ExternalLink, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'

interface SharedCompany {
  company_id: string
  company_name: string
  permissions: string[]
}

interface Document {
  id: string
  name: string
  file_path: string
  file_size: number
  mime_type: string
  is_public: boolean
  created_at: string
}

export default function PublicSharedCompanyPage({ params }: { params: Promise<{ token: string }> }) {
  const [company, setCompany] = useState<SharedCompany | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string>('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setToken(resolvedParams.token)
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (token) {
      fetchSharedCompany()
    }
  }, [token])

  const fetchSharedCompany = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      setError(null)

      // Récupérer les informations de l'entreprise partagée
      const { data, error } = await supabase
        .rpc('get_shared_company', { token_param: token })

      if (error) {
        console.error('Erreur lors de la récupération:', error)
        setError('Entreprise non trouvée ou lien expiré')
        return
      }

      if (!data || data.length === 0) {
        setError('Entreprise non trouvée')
        return
      }

      const companyData = data[0]
      setCompany(companyData)

      // Récupérer les documents publics de l'entreprise
      if (companyData.permissions.includes('view_documents')) {
        const { data: docs, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('company_id', companyData.company_id)
          .eq('is_public', true)
          .order('created_at', { ascending: false })

        if (!docsError && docs) {
          setDocuments(docs)
        }
      }

    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('company-files')
        .download(doc.file_path)

      if (error) {
        console.error('Erreur lors du téléchargement:', error)
        return
      }

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error('Erreur lors du téléchargement:', err)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de l'entreprise...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !company) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl">Accès non autorisé</CardTitle>
              <CardDescription>
                {error || 'Cette entreprise n\'est pas accessible'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Retour à l'accueil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* En-tête de l'entreprise */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">{company.company_name}</CardTitle>
                    <CardDescription>
                      Entreprise partagée publiquement
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Lien public
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Documents publics */}
          {company.permissions.includes('view_documents') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents publics
                </CardTitle>
                <CardDescription>
                  Documents partagés par cette entreprise
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Aucun document public disponible
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(doc.file_size)} • {doc.mime_type}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informations sur le partage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations sur le partage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type de partage</p>
                  <p>Lien public</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Permissions</p>
                  <div className="flex gap-2 mt-1">
                    {company.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission === 'view_company' ? 'Voir l\'entreprise' : 'Voir les documents'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
} 