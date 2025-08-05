'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, ArrowLeft, Calendar, Mail, Phone, MapPin, FileText, Download, Eye, Share, Globe } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Company {
  id: string
  company_name: string
  siren?: string
  siret?: string
  address_line_1?: string
  address_line_2?: string
  postal_code?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  description?: string
  ape_code?: string
  vat_number?: string
  payment_terms?: string[]
  rib?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  name: string
  display_name?: string
  document_type: string
  file_path: string
  file_size: number
  mime_type: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function SharedCompanyPage({ params }: { params: Promise<{ 'company-id': string }> }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)

  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setCompanyId(resolvedParams['company-id'])
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (companyId) {
      fetchCompanyData()
    }
  }, [companyId])

  const fetchCompanyData = async () => {
    try {
      setLoading(true)
      
      // Récupérer les informations de l'entreprise
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (companyError) {
        throw new Error('Erreur lors de la récupération de l\'entreprise')
      }

      setCompany(companyData)

      // Récupérer les documents partagés (seulement les publics)
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_public', true)

      if (documentsError) {
        console.error('Erreur lors de la récupération des documents:', documentsError)
      } else {
        setDocuments(documentsData || [])
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const getDocumentIcon = (documentType: string) => {
    switch ((documentType || '').toLowerCase()) {
      case 'pdf':
        return '📄'
      case 'image':
        return '��️'
      case 'document':
        return '📝'
      default:
        return '📎'
    }
  }

  const viewDocument = async (doc: Document) => {
    try {
      setViewing(doc.id)
      
      // Construire le chemin complet du fichier (avec le préfixe 'documents/')
      const fullPath = `documents/${doc.file_path}`
      console.log('🔍 Tentative d\'ouverture du document:', fullPath)
      
      const { data, error } = await supabase.storage
        .from('company-files')
        .createSignedUrl(fullPath, 60)

      if (error) {
        console.log("🔄 Tentative avec URL publique...")
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-files/${fullPath}`
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
    } catch (err) {
      toast.error('Erreur lors de l\'ouverture du document')
      console.error('Erreur:', err)
    } finally {
      setViewing(null)
    }
  }

  const downloadDocument = async (doc: Document) => {
    try {
      setDownloading(doc.id)
      
      // Construire le chemin complet du fichier (avec le préfixe 'documents/')
      const fullPath = `documents/${doc.file_path}`
      console.log('🔍 Tentative de téléchargement du document:', fullPath)
      
      const { data, error } = await supabase.storage
        .from('company-files')
        .createSignedUrl(fullPath, 60)

      if (error) {
        console.log("🔄 Tentative avec URL publique...")
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-files/${fullPath}`
        console.log("🔗 URL publique:", publicUrl)
        window.open(publicUrl, "_blank")
        return
      }

      if (data?.signedUrl) {
        console.log('URL signée générée:', data.signedUrl)
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = doc.display_name || doc.name || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Téléchargement démarré')
      } else {
        console.error('URL signée non générée')
        toast.error('Impossible de télécharger le document')
      }
    } catch (err) {
      toast.error('Erreur lors du téléchargement')
      console.error('Erreur:', err)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !company) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                {error || 'Entreprise non trouvée'}
              </p>
              <Button asChild className="mt-4">
                <Link href="/shared-companies">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux entreprises partagées
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/shared-companies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux entreprises partagées
            </Link>
          </Button>
          
          <div className="flex items-start gap-4 mb-4">
            {company.logo_url ? (
              <div className="flex-shrink-0">
                <img
                  src={company.logo_url}
                  alt={`Logo de ${company.company_name}`}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
                />
              </div>
            ) : (
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{company.company_name}</h1>
              <p className="text-muted-foreground">
                Entreprise partagée avec vous
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" onClick={async () => { 
                  await navigator.clipboard.writeText(window.location.href); 
                  toast.success("Lien copié dans le presse-papiers"); 
                }}>
                  <Share className="h-4 w-4 mr-2" />
                  Copier le lien
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informations de l'entreprise */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
              <CardDescription>
                Détails de l'entreprise partagée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Nom de l'entreprise</p>
                    <p className="text-sm text-muted-foreground">{company.company_name}</p>
                  </div>
                </div>

                {company.siren && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">SIREN</p>
                      <p className="text-sm text-muted-foreground">{company.siren}</p>
                    </div>
                  </div>
                )}

                {company.siret && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">SIRET</p>
                      <p className="text-sm text-muted-foreground">{company.siret}</p>
                    </div>
                  </div>
                )}

                {(company.address_line_1 || company.postal_code || company.city) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-sm text-muted-foreground">
                        {[
                          company.address_line_1,
                          company.address_line_2,
                          company.postal_code && company.city ? `${company.postal_code} ${company.city}` : null,
                          company.country
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-sm text-muted-foreground">{company.phone}</p>
                    </div>
                  </div>
                )}

                {company.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{company.email}</p>
                    </div>
                  </div>
                )}

                {company.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Site web</p>
                      <p className="text-sm text-muted-foreground">{company.website}</p>
                    </div>
                  </div>
                )}

                {company.ape_code && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Code APE</p>
                      <p className="text-sm text-muted-foreground">{company.ape_code}</p>
                    </div>
                  </div>
                )}

                {company.vat_number && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">TVA intracommunautaire</p>
                      <p className="text-sm text-muted-foreground">{company.vat_number}</p>
                    </div>
                  </div>
                )}

                {company.payment_terms && company.payment_terms.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Conditions de paiement</p>
                      <p className="text-sm text-muted-foreground">{company.payment_terms.join(', ')}</p>
                    </div>
                  </div>
                )}

                {company.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Description</p>
                      <p className="text-sm text-muted-foreground">{company.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Documents partagés par cette entreprise
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun document partagé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getDocumentIcon(doc.document_type)}</span>
                        <div>
                          <p className="font-medium">{doc.display_name || doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.document_type} • {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{(doc.document_type || "").toLowerCase()}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDocument(doc)}
                          disabled={viewing === doc.id}
                        >
                          {viewing === doc.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadDocument(doc)}
                          disabled={downloading === doc.id}
                        >
                          {downloading === doc.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
