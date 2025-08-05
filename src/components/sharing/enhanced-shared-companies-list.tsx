'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building, 
  Eye, 
  Calendar, 
  Users, 
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface CompanyShare {
  id: string
  company_id: string
  shared_with_email: string
  share_token: string
  is_active: boolean
  permissions: string[]
  created_at: string
  company_name: string
  siren?: string
  siret?: string
  logo_url?: string
}

interface EnhancedSharedCompaniesListProps {
  companies: CompanyShare[]
  loading: boolean
}

export function EnhancedSharedCompaniesList({ companies, loading }: EnhancedSharedCompaniesListProps) {
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-full">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Fiches partagées
            </h2>
            <p className="text-muted-foreground mt-2">
              Accès aux fiches d'entreprise partagées avec vous
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header avec animation */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-full">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
                  <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Fiches partagées
            </h2>
            <p className="text-muted-foreground mt-2">
              Accès aux fiches d'entreprise partagées avec vous
            </p>
          </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-pink-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Total
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.length}</p>
                <p className="text-sm text-muted-foreground">Fiches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-emerald-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Actives
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.filter(c => c.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Accès actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Récents
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.filter(c => {
                  const date = new Date(c.created_at)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return date > weekAgo
                }).length}</p>
                <p className="text-sm text-muted-foreground">Cette semaine</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des entreprises */}
      {companies.length === 0 ? (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="text-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full blur-xl opacity-20"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-full">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-purple-900">Aucune fiche partagée</h3>
            <p className="text-purple-800 mb-6 max-w-md mx-auto">
              Vous n'avez pas encore accès à des fiches d'entreprise partagées. 
              Les fiches partagées apparaîtront ici une fois que quelqu'un vous aura donné accès.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                <Link href="/companies">
                  <Globe className="h-4 w-4 mr-2" />
                  Voir mes entreprises
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                <Link href="/dashboard">
                  Retour au tableau de bord
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg group">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-pink-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                {company.is_active ? 'Actif' : 'Inactif'}
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  {company.logo_url ? (
                    <div className="flex-shrink-0">
                      <img
                        src={company.logo_url}
                        alt={`Logo de ${company.company_name}`}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200 group-hover:border-purple-300 transition-colors"
                      />
                    </div>
                  ) : (
                    <div className="bg-purple-100 p-2 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                      <Building className="h-6 w-6 text-purple-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2" title={company.company_name}>
                      {company.company_name}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {company.siret || company.siren || 'SIRET/SIREN non renseigné'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Partagé par</span>
                    <span className="font-medium">{company.shared_with_email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Partagé le</span>
                    <span>{format(new Date(company.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Statut</span>
                    <Badge variant={company.is_active ? 'default' : 'secondary'}>
                      {company.is_active ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {company.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                  <Link href={`/shared-companies/${company.company_id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Consulter la fiche
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
