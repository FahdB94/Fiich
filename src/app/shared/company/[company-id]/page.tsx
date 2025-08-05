'use client'

import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, FileText, Download, Mail, Phone, MapPin, Globe, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'

interface Company {
  id: string
  company_name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  siret: string
  created_at: string
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

interface CompanyShare {
  id: string
  permissions: string[]
  created_at: string
}

export default function SharedCompanyPage({ params }: { params: Promise<{ 'company-id': string }> }) {
  const resolvedParams = use(params)
  const [company, setCompany] = useState<Company | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [share, setShare] = useState<CompanyShare | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string>('')

  // Utilise le client Supabase configuré

  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setCompanyId(resolvedParams['company-id'])
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (companyId) {
      fetchSharedCompany()
    }
  }, [companyId])

  const fetchSharedCompany = async () => {
    if (!companyId) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 fetchSharedCompany - companyId:', companyId)

      // Vérifier que l'utilisateur a accès à cette entreprise
      const { data: { user } } = await supabase.auth.getUser()
      console.log('📥 Utilisateur récupéré:', user?.email)
      
      if (!user) {
        console.error('❌ Utilisateur non connecté')
        setError('Vous devez être connecté')
        return
      }

      // Récupérer le partage
      console.log('🔍 Recherche partage pour:', { companyId, userEmail: user.email })
      const { data: shareData, error: shareError } = await supabase
        .from('company_shares')
        .select('*')
        .eq('company_id', companyId)
        .eq('shared_with_email', user.email)
        .eq('is_active', true)
        .single()

      console.log('📥 Résultat partage:', { shareData, shareError })

      if (shareError || !shareData) {
        console.error('❌ Erreur partage:', shareError)
        setError('Vous n\'avez pas accès à cette entreprise')
        return
      }

      console.log('✅ Partage trouvé:', shareData)
      setShare(shareData)

      // Récupérer les informations de l'entreprise
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (companyError || !companyData) {
        setError('Entreprise non trouvée')
        return
      }

      setCompany(companyData)

      // Récupérer les documents si l'utilisateur a les permissions
      if (shareData.permissions.includes('view_documents')) {
        const { data: docs, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('company_id', resolvedParams['company-id'])
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
    console.log("🔍 downloadDocument appelé avec:", doc)
    try {
      const { data, error } = await supabase.storage
        .from('company-files')
        .createSignedUrl(`documents/${doc.file_path}`, 60)

      if (error) {
        console.log("🔄 Tentative avec URL publique...")
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-files/documents/${doc.file_path}`
        console.log("🔗 URL publique:", publicUrl)
        const link = document.createElement("a")
        link.href = publicUrl
        link.download = doc.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        console.log("✅ Téléchargement démarré via URL publique")
        return
        console.error('Erreur lors du téléchargement:', error)
        return
      }

      // Créer un lien de téléchargement
      const url = data.signedUrl
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      

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

  if (error || !company || !share) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl">Accès non autorisé</CardTitle>
              <CardDescription>
                {error || 'Vous n\'avez pas accès à cette entreprise'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Retour au tableau de bord
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* En-tête de l'entreprise */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">{company.company_name}</CardTitle>
                    <CardDescription>
                      Entreprise partagée avec vous
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">
                  <Building className="h-3 w-3 mr-1" />
                  Partagée
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Raison sociale</p>
                  <p className="text-sm">{company.company_name}</p>
                </div>
                {company.siret && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SIRET</p>
                    <p className="text-sm font-mono">{company.siret}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${company.email}`} className="text-sm hover:underline">
                      {company.email}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${company.phone}`} className="text-sm hover:underline">
                      {company.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Adresse */}
          {(company.address || company.city || company.postal_code) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {company.address && <div>{company.address}</div>}
                  {(company.postal_code || company.city) && (
                    <div>
                      {company.postal_code} {company.city}
                    </div>
                  )}
                  {company.country && <div>{company.country}</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents publics */}
          {share.permissions.includes('view_documents') && (
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
                  <p>Invitation acceptée</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Permissions</p>
                  <div className="flex gap-2 mt-1">
                    {share.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission === 'view_company' ? 'Voir l\'entreprise' : 'Voir les documents'}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Partagé le</p>
                  <p className="text-sm">{new Date(share.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
} 