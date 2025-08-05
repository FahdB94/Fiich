'use client'

import { useAuth } from '@/hooks/use-auth'
import { useCompanies } from '@/hooks/use-companies'
import { MainLayout } from '@/components/layout/main-layout'
import { DocumentManager } from '@/components/documents'
import ShareCompany from '@/components/sharing/share-company'
import { CompanyOverview } from '@/components/company/company-overview'
import { EnhancedDocumentManager } from '@/components/documents/enhanced-document-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit, Share, Building, Mail, Phone, Globe, MapPin, FileText, Users, Hash } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { redirect, useParams } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'

export default function CompanyDetailPage() {
  const { user, loading } = useAuth()
  const { companies, loading: companiesLoading } = useCompanies(user?.id)
  const params = useParams()
  const companyId = params.id as string
  const [activeTab, setActiveTab] = useState("overview")
  const [documentCount, setDocumentCount] = useState(0)
  const [sharedWithCount, setSharedWithCount] = useState(0)
  const [statsLoading, setStatsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Redirect to signin if not authenticated
  if (!loading && !user) {
    redirect('/auth/signin')
  }

  const company = useMemo(() => 
    companies.find(c => c.id === companyId), 
    [companies, companyId]
  )

  // Récupérer les vraies données
  useEffect(() => {
    if (company) {
      fetchRealData()
    }
  }, [company, lastRefresh])

  // Rafraîchir les stats quand on change d'onglet vers "overview"
  useEffect(() => {
    if (activeTab === "overview" && company) {
      // Petit délai pour éviter les appels multiples
      const timer = setTimeout(() => {
        fetchRealData()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [activeTab, company])

  // Rafraîchir les stats périodiquement quand on est sur l'onglet overview
  useEffect(() => {
    if (activeTab === "overview" && company) {
      const interval = setInterval(() => {
        fetchRealData()
      }, 30000) // Rafraîchir toutes les 30 secondes
      
      return () => clearInterval(interval)
    }
  }, [activeTab, company])

  const fetchRealData = async () => {
    if (!company) return
    
    try {
      setStatsLoading(true)
      
      // Compter les documents
      const { count: docCount, error: docError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
      
      if (docError) {
        console.error('Erreur lors du comptage des documents:', docError)
      }
      
      // Compter les partages actifs
      const { count: shareCount, error: shareError } = await supabase
        .from('company_shares')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('is_active', true)
      
      if (shareError) {
        console.error('Erreur lors du comptage des partages:', shareError)
      }
      
      setDocumentCount(docCount || 0)
      setSharedWithCount(shareCount || 0)
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const refreshStats = () => {
    setLastRefresh(new Date())
  }

  if (companiesLoading || loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!company) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                Entreprise non trouvée
              </p>
              <Button asChild className="mt-4">
                <Link href="/companies">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux entreprises
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const formatAddress = () => {
    if (!company) return ""
    const parts = [
      company.address_line_1,
      company.address_line_2,
      company.postal_code,
      company.city,
      company.country
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : "Adresse non renseignée"
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/companies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux entreprises
            </Link>
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
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
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{company.company_name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {company.siret && (
                    <div className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      <span className="text-sm">{company.siret}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{formatAddress()}</span>
                  </div>
                </div>
                {company.description && (
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {company.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/companies/${company?.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Link>
              </Button>
              <Button onClick={() => setActiveTab("sharing")}>
                <Share className="h-4 w-4 mr-2" />
                Partager
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="sharing" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Partage
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <CompanyOverview 
              company={company} 
              documentCount={documentCount} 
              sharedWithCount={sharedWithCount}
              statsLoading={statsLoading}
              onRefresh={refreshStats}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <EnhancedDocumentManager companyId={company?.id} />
          </TabsContent>

          <TabsContent value="sharing" className="space-y-6">
            <ShareCompany companyId={company?.id} companyName={company.company_name} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
