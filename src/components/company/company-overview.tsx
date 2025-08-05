'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar,
  TrendingUp,
  Users,
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Receipt,
  User,
  Hash,
  ExternalLink,
  Euro,
  Clock,
  Briefcase,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Company, CompanyContact } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface CompanyOverviewProps {
  company: Company
  documentCount?: number
  sharedWithCount?: number
  statsLoading?: boolean
  onRefresh?: () => void
}

export function CompanyOverview({ 
  company, 
  documentCount = 0, 
  sharedWithCount = 0, 
  statsLoading = false,
  onRefresh 
}: CompanyOverviewProps) {
  const getStatusColor = (hasValue: boolean) => {
    return hasValue ? 'text-green-600' : 'text-orange-600'
  }

  const getStatusIcon = (hasValue: boolean) => {
    return hasValue ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />
  }

  const formatAddress = () => {
    const parts = [
      company.address_line_1,
      company.address_line_2,
      company.postal_code,
      company.city,
      company.country
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : "Adresse non renseignée"
  }

  const formatRIB = (rib?: string) => {
    if (!rib) return "Non renseigné"
    return rib.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatPaymentTerms = (terms?: string[]) => {
    if (!terms || terms.length === 0) return "Non renseignées"
    return terms.join(', ')
  }

  return (
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {company.company_name}
          </h2>
          <p className="text-muted-foreground mt-2">
            Fiche complète de l'entreprise
          </p>
        </div>
        {onRefresh && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={statsLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
              {statsLoading ? 'Actualisation...' : 'Actualiser les statistiques'}
            </Button>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Documents
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className={`h-6 w-6 text-blue-600 ${statsLoading ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : documentCount}
                </p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-emerald-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Partagé
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className={`h-6 w-6 text-green-600 ${statsLoading ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : sharedWithCount}
                </p>
                <p className="text-sm text-muted-foreground">Personnes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-violet-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Contacts
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <User className={`h-6 w-6 text-purple-600 ${statsLoading ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : (company.contacts?.length || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:border-orange-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-red-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Statut
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Shield className={`h-6 w-6 text-orange-600 ${statsLoading ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">Actif</p>
                <p className="text-sm text-muted-foreground">Entreprise active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations détaillées */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations générales */}
        <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Général
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Informations générales</CardTitle>
                <CardDescription>
                  Données d'identification de l'entreprise
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Nom de l'entreprise</span>
                </div>
                <span className="text-sm font-mono">{company.company_name}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">SIREN</span>
                </div>
                <span className="text-sm font-mono">{company.siren || "Non renseigné"}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">SIRET</span>
                </div>
                <span className="text-sm font-mono">{company.siret || "Non renseigné"}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Code APE</span>
                </div>
                <span className="text-sm font-mono">{company.ape_code || "Non renseigné"}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">TVA Intra</span>
                </div>
                <span className="text-sm font-mono">{company.vat_number || "Non renseigné"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations de contact */}
        <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-emerald-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Contact
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Informations de contact</CardTitle>
                <CardDescription>
                  Coordonnées de l'entreprise
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{company.email || 'Non renseigné'}</span>
                  {getStatusIcon(!!company.email)}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Téléphone</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{company.phone || 'Non renseigné'}</span>
                  {getStatusIcon(!!company.phone)}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Site web</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{company.website || 'Non renseigné'}</span>
                  {getStatusIcon(!!company.website)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adresse complète */}
      <Card className="relative overflow-hidden border-2 hover:border-indigo-200 transition-all duration-300 hover:shadow-lg">
        <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-purple-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
          Adresse
        </div>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <MapPin className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Adresse complète</CardTitle>
              <CardDescription>
                Localisation de l'entreprise
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm leading-relaxed">{formatAddress()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Informations financières */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden border-2 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Financier
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Informations financières</CardTitle>
                <CardDescription>
                  Données bancaires et conditions de paiement
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">RIB</span>
                </div>
                <span className="text-sm font-mono max-w-[200px] truncate" title={formatRIB(company.rib)}>
                  {formatRIB(company.rib)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Conditions de paiement</span>
                </div>
                <span className="text-sm max-w-[200px] truncate" title={formatPaymentTerms(company.payment_terms)}>
                  {formatPaymentTerms(company.payment_terms)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts détaillés */}
        <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-violet-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Contacts
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Contacts détaillés</CardTitle>
                <CardDescription>
                  Personnes de contact de l'entreprise
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.contacts && company.contacts.length > 0 ? (
              <div className="space-y-3">
                {company.contacts.map((contact, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {contact.contact_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {contact.job_title}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{contact.name}</p>
                      {contact.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun contact renseigné</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {company.description && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 leading-relaxed">{company.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Informations temporelles */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Informations temporelles</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Créée le</span>
                  <span className="text-sm text-gray-600">
                    {format(new Date(company.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Dernière modification</span>
                  <span className="text-sm text-gray-600">
                    {format(new Date(company.updated_at), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
