'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'
import { useCompanies } from '@/hooks/use-companies'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SearchInput } from '@/components/ui/search-input'
import { useSearch } from '@/hooks/use-search'
import Link from 'next/link'
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  MoreHorizontal,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Hash,
  Filter,
  Grid3X3,
  List,
  RefreshCw,
  ArrowRight,
  Calendar,
  Users,
  FileText
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function CompaniesPage() {
  const { user, loading } = useAuth()
  const { companies, loading: companiesLoading } = useCompanies(user?.id)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statsLoading, setStatsLoading] = useState(false)
  const [companyStats, setCompanyStats] = useState<{[key: string]: {documents: number, shares: number}}>({})

  // Configuration de la recherche et des filtres
  const {
    searchQuery,
    selectedFilters,
    availableFilters,
    filteredData: filteredCompanies,
    stats,
    setSearchQuery,
    setSelectedFilters,
    clearSearch
  } = useSearch({
    data: companies,
    searchFields: ['company_name', 'email', 'city', 'siret', 'siren'],
    filterFields: {
      city: {
        label: 'Ville',
        getValue: (company) => company.city || '',
        getLabel: (company) => company.city || 'Non renseignée'
      },
      hasDocuments: {
        label: 'Documents',
        getValue: (company) => (companyStats[company.id]?.documents || 0) > 0 ? 'with-documents' : 'no-documents',
        getLabel: (company) => (companyStats[company.id]?.documents || 0) > 0 ? 'Avec documents' : 'Sans documents'
      },
      hasShares: {
        label: 'Partages',
        getValue: (company) => (companyStats[company.id]?.shares || 0) > 0 ? 'shared' : 'not-shared',
        getLabel: (company) => (companyStats[company.id]?.shares || 0) > 0 ? 'Partagée' : 'Non partagée'
      }
    },
    sortOptions: [
      {
        label: 'Nom A-Z',
        value: 'name-asc',
        sortFn: (a, b) => a.company_name.localeCompare(b.company_name)
      },
      {
        label: 'Nom Z-A',
        value: 'name-desc',
        sortFn: (a, b) => b.company_name.localeCompare(a.company_name)
      },
      {
        label: 'Plus récentes',
        value: 'date-desc',
        sortFn: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      },
      {
        label: 'Plus anciennes',
        value: 'date-asc',
        sortFn: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
    ]
  })

  // Redirect to signin if not authenticated
  if (!loading && !user) {
    redirect('/auth/signin')
  }

  // Récupérer les statistiques des entreprises
  useEffect(() => {
    if (companies.length > 0) {
      fetchCompanyStats()
    }
  }, [companies])

  const fetchCompanyStats = async () => {
    try {
      setStatsLoading(true)
      const companyIds = companies.map(c => c.id)
      
      if (companyIds.length === 0) {
        setCompanyStats({})
        return
      }
      
      // Récupérer les statistiques de documents et partages pour chaque entreprise
      const [docResult, shareResult] = await Promise.all([
        supabase
          .from('documents')
          .select('company_id')
          .in('company_id', companyIds),
        supabase
          .from('company_shares')
          .select('company_id')
          .in('company_id', companyIds)
          .eq('is_active', true)
      ])

      // Compter les documents et partages par entreprise
      const stats: {[key: string]: {documents: number, shares: number}} = {}
      
      // Initialiser les compteurs
      companyIds.forEach(id => {
        stats[id] = { documents: 0, shares: 0 }
      })

      // Compter les documents
      docResult.data?.forEach(doc => {
        if (stats[doc.company_id]) {
          stats[doc.company_id].documents++
        }
      })

      // Compter les partages
      shareResult.data?.forEach(share => {
        if (stats[share.company_id]) {
          stats[share.company_id].shares++
        }
      })

      setCompanyStats(stats)
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  // Filter companies based on search term and filters
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.siren && company.siren.includes(searchTerm)) ||
      (company.siret && company.siret.includes(searchTerm))

    if (!matchesSearch) return false

    switch (filterType) {
      case 'recent':
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return new Date(company.created_at) > oneWeekAgo
      case 'with-documents':
        return companyStats[company.id]?.documents > 0
      case 'shared':
        return companyStats[company.id]?.shares > 0
      default:
        return true
    }
  })

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

  if (loading || companiesLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-lg"></div>
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
                  <Building className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Mes entreprises
              </h1>
              <p className="text-muted-foreground mt-2">
                Gérez vos fiches d'identité entreprise
              </p>
            </div>
            <div className="flex justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              <Link href="/companies/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle entreprise
              </Link>
            </Button>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 items-center w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher une entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="recent">Récentes (7j)</SelectItem>
                  <SelectItem value="with-documents">Avec documents</SelectItem>
                  <SelectItem value="shared">Partagées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Statistiques rapides */}
          {companies.length > 0 && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Total
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
                      <p className="text-sm text-muted-foreground">Entreprises</p>
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
                        {statsLoading ? '...' : Object.values(companyStats).reduce((sum, stat) => sum + stat.documents, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Documents</p>
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
                      <Users className={`h-6 w-6 text-purple-600 ${statsLoading ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {statsLoading ? '...' : Object.values(companyStats).reduce((sum, stat) => sum + stat.shares, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Partages actifs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 hover:border-orange-200 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-red-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Récentes
                </div>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Calendar className={`h-6 w-6 text-orange-600 ${statsLoading ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {statsLoading ? '...' : companies.filter(c => {
                          const oneWeekAgo = new Date()
                          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                          return new Date(c.created_at) > oneWeekAgo
                        }).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Cette semaine</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Companies Grid/List */}
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
                    Créer ma première entreprise
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : filteredCompanies.length === 0 ? (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-full blur-xl opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-full">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-orange-900">
                  Aucun résultat
                </h3>
                <p className="text-orange-800 text-center mb-8 max-w-md">
                  Aucune entreprise ne correspond à votre recherche "{searchTerm}".
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  Effacer la recherche
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" 
              : "space-y-4"
            }>
              {filteredCompanies.map((company) => (
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
                              onError={(e) => console.error('❌ Erreur chargement logo:', company.logo_url)}
                              onLoad={() => console.log('✅ Logo chargé:', company.logo_url)}
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
                              {Array.isArray(formatAddress(company)) ? (
                                formatAddress(company).map((line, index) => (
                                  <div key={index} className="leading-tight text-xs">
                                    {line}
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs">{formatAddress(company)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/companies/${company.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/companies/${company.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/companies/${company.id}`}>
                              <FileText className="mr-2 h-4 w-4" />
                              Documents
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/companies/${company.id}`}>
                              <Users className="mr-2 h-4 w-4" />
                              Partager
                            </Link>
                          </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

          {/* Stats */}
          {companies.length > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              {searchTerm ? (
                <>
                  {filteredCompanies.length} résultat{filteredCompanies.length > 1 ? 's' : ''} sur {companies.length} entreprise{companies.length > 1 ? 's' : ''}
                </>
              ) : (
                <>
                  {companies.length} entreprise{companies.length > 1 ? 's' : ''} au total
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}