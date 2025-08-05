'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'
import { useCompanies } from '@/hooks/use-companies'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Building, 
  FileText, 
  Plus, 
  Share2, 
  Users, 
  TrendingUp, 
  Calendar,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Activity,
  Shield,
  Clock,
  Eye,
  Edit
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function TableauDeBordPage() {
  const [documentCount, setDocumentCount] = useState(0)
  const [sharedCount, setSharedCount] = useState(0)
  const [invitationCount, setInvitationCount] = useState(0)
  const [statsLoading, setStatsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { user, loading } = useAuth()
  const { companies, loading: companiesLoading } = useCompanies(user?.id)

  // Récupérer les vraies données
  useEffect(() => {
    if (user && companies.length > 0) {
      fetchTableauDeBordData()
    } else if (user && companies.length === 0) {
      // Si pas d'entreprises, mettre les compteurs à 0
      setDocumentCount(0)
      setSharedCount(0)
      setInvitationCount(0)
    }
  }, [user, companies, lastRefresh])

  // Rafraîchissement périodique
  useEffect(() => {
    if (user && companies.length > 0) {
      const interval = setInterval(() => {
        fetchTableauDeBordData()
      }, 30000) // Rafraîchir toutes les 30 secondes
      
      return () => clearInterval(interval)
    }
  }, [user, companies])

  const fetchTableauDeBordData = async () => {
    try {
      setStatsLoading(true)
      const companyIds = companies.map(c => c.id)
      
      // Requêtes parallèles pour optimiser les performances
      const [docResult, shareResult, inviteResult] = await Promise.all([
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .in('company_id', companyIds),
        supabase
          .from('company_shares')
          .select('*', { count: 'exact', head: true })
          .in('company_id', companyIds)
          .eq('is_active', true),
        supabase
          .from('invitations')
          .select('*', { count: 'exact', head: true })
          .eq('invited_email', user?.email)
          .eq('status', 'pending')
      ])
      
      setDocumentCount(docResult.count || 0)
      setSharedCount(shareResult.count || 0)
      setInvitationCount(inviteResult.count || 0)
    } catch (error) {
      console.error('Erreur lors de la récupération des données du tableau de bord:', error)
      // En cas d'erreur, on met des valeurs par défaut
      setDocumentCount(0)
      setSharedCount(0)
      setInvitationCount(0)
    } finally {
      setStatsLoading(false)
    }
  }

  const refreshStats = () => {
    setLastRefresh(new Date())
    fetchTableauDeBordData()
  }

  const formatAddress = (company: any) => {
    const parts = [
      company.address_line_1,
      company.postal_code,
      company.city,
      company.country
    ].filter(Boolean)
    
    if (parts.length === 0) {
      return "Adresse non renseignée"
    }
    
    // Formatage sur plusieurs lignes
    const lines = []
    if (company.address_line_1) lines.push(company.address_line_1)
    if (company.postal_code && company.city) {
      lines.push(`${company.postal_code} ${company.city}`)
    } else if (company.postal_code) {
      lines.push(company.postal_code)
    } else if (company.city) {
      lines.push(company.city)
    }
    if (company.country) lines.push(company.country)
    
    return lines
  }

  // Redirect to signin if not authenticated
  if (!loading && !user) {
    redirect('/auth/signin')
  }

  if (loading || companiesLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header avec animation */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-full">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-muted-foreground mt-2">
                Bienvenue, {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
              </p>
            </div>
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshStats}
                disabled={statsLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                {statsLoading ? 'Actualisation...' : 'Actualiser les statistiques'}
              </Button>
            </div>
          </div>

          {/* Stats Cards avec design moderne */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                Entreprises
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building className={`h-6 w-6 text-blue-600 ${statsLoading ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {statsLoading ? '...' : companies.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Fiches créées</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-emerald-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                Documents
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FileText className={`h-6 w-6 text-green-600 ${statsLoading ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {statsLoading ? '...' : documentCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Fichiers stockés</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-violet-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                Partages
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Share2 className={`h-6 w-6 text-purple-600 ${statsLoading ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {statsLoading ? '...' : sharedCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Liens actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-orange-200 transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-red-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                Invitations
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Users className={`h-6 w-6 text-orange-600 ${statsLoading ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {statsLoading ? '...' : invitationCount}
                    </p>
                    <p className="text-sm text-muted-foreground">En attente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Companies avec design amélioré */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Mes entreprises récentes
                </h2>
                <p className="text-muted-foreground">
                  Vos dernières fiches d'identité entreprise
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/companies" className="gap-2">
                  Voir tout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {companies.length === 0 ? (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-xl opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-full">
                      <Building className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-blue-900">
                    Aucune entreprise
                  </h3>
                  <p className="text-blue-800 text-center mb-8 max-w-md">
                    Créez votre première fiche d'identité entreprise pour commencer
                    à partager vos informations avec vos partenaires.
                  </p>
                  <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Link href="/companies/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Créer une entreprise
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {companies.slice(0, 6).map((company) => (
                  <Card key={company.id} className="group hover:shadow-lg transition-all duration-300 border hover:border-blue-200 h-full flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {company.logo_url ? (
                            <div className="flex-shrink-0">
                              <img
                                src={company.logo_url}
                                alt={`Logo de ${company.company_name}`}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                              />
                            </div>
                          ) : (
                            <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                              <Building className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-blue-600 transition-colors mb-2">
                              {company.company_name}
                            </CardTitle>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                                              {(() => {
                                const address = formatAddress(company);
                                if (Array.isArray(address)) {
                                  return address.map((line, index) => (
                                    <div key={index} className="leading-tight text-xs">
                                      {line}
                                    </div>
                                  ));
                                } else {
                                  return <span className="text-xs">{address}</span>;
                                }
                              })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 flex-1 flex flex-col">
                      {/* Informations principales */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-xs break-all leading-relaxed">{company.email}</span>
                        </div>
                        {company.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs">{company.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Badges SIRET/SIREN */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {company.siret && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            SIRET: {company.siret}
                          </Badge>
                        )}
                        {company.siren && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            SIREN: {company.siren}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Description (si disponible) */}
                      {company.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2 bg-muted/20 p-2 rounded mb-3 leading-relaxed">
                          {company.description}
                        </div>
                      )}
                      
                      {/* Actions - toujours en bas */}
                      <div className="flex items-center justify-between pt-2 border-t mt-auto">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Créée le {format(new Date(company.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" asChild className="h-7 px-2">
                            <Link href={`/companies/${company.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild className="h-7 px-2">
                            <Link href={`/companies/${company.id}/edit`}>
                              <Edit className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions avec design moderne */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Plus className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Créer une entreprise</h3>
                    <p className="text-sm text-muted-foreground">Nouvelle fiche d'identité</p>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/companies/new">
                    Commencer
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Mon profil</h3>
                    <p className="text-sm text-muted-foreground">Gérer mes informations</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">
                    Accéder
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Share2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Entreprises partagées</h3>
                    <p className="text-sm text-muted-foreground">Accès reçus</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/shared-companies">
                    Consulter
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Informations temporelles */}
          <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Dernière activité</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Dernière connexion</span>
                      <span className="text-sm text-gray-600 ml-4">
                        {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Entreprises créées</span>
                      <span className="text-sm text-gray-600">
                        {companies.length} fiche{companies.length > 1 ? 's' : ''}
                      </span>
                    </div>
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
