'use client'

import { useState, useEffect } from 'react'
import { useActiveShares } from '@/hooks/use-active-shares'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building, 
  Mail, 
  Calendar, 
  Users, 
  X, 
  AlertCircle,
  Share2,
  Trash2,
  MapPin,
  Phone,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'
import { MainLayout } from '@/components/layout/main-layout'
import { PermissionsModal } from '@/components/sharing/permissions-modal'

export default function ActiveSharesPage() {
  const { shares, loading, error, revokeShare, updatePermissions } = useActiveShares()
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [userCompany, setUserCompany] = useState<any>(null)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [selectedShare, setSelectedShare] = useState<any>(null)

  const handleRevokeShare = async (shareId: string, companyName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir révoquer l'accès de ${companyName} à votre entreprise ?`)) {
      return
    }

    setRevokingId(shareId)
    const success = await revokeShare(shareId)
    setRevokingId(null)

    if (success) {
      toast.success('Accès révoqué avec succès')
    } else {
      toast.error('Erreur lors de la révocation de l\'accès')
    }
  }

  const handleOpenPermissions = (share: any) => {
    setSelectedShare(share)
    setPermissionsModalOpen(true)
  }

  const handleClosePermissions = () => {
    setPermissionsModalOpen(false)
    setSelectedShare(null)
  }

  // Récupérer les informations de l'entreprise de l'utilisateur
  useEffect(() => {
    const fetchUserCompany = async () => {
      if (shares.length > 0) {
        // Prendre la première entreprise (normalement l'utilisateur n'a qu'une entreprise)
        const firstShare = shares[0]
        setUserCompany({
          id: firstShare.company_id,
          name: firstShare.company_name,
          email: firstShare.company_email,
          phone: firstShare.company_phone,
          city: firstShare.company_city,
          country: firstShare.company_country,
          logo_url: firstShare.logo_url
        })
      }
    }
    fetchUserCompany()
  }, [shares])

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement des partages...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Erreur</h2>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Réessayer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* En-tête avec votre entreprise */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Mes Partages Actifs</h1>
                <p className="text-muted-foreground">
                  Gérez les accès à votre entreprise partagée avec d'autres utilisateurs
                </p>
              </div>
              <Link href="/companies">
                <Button variant="outline">
                  <Building className="h-4 w-4 mr-2" />
                  Gérer mon entreprise
                </Button>
              </Link>
            </div>

            {/* Informations de votre entreprise */}
            {userCompany && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    {/* Logo de votre entreprise */}
                    <div className="flex-shrink-0">
                      {userCompany.logo_url ? (
                        <img
                          src={userCompany.logo_url}
                          alt={userCompany.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Building className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Informations de votre entreprise */}
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2">{userCompany.name}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        {userCompany.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{userCompany.email}</span>
                          </div>
                        )}
                        {userCompany.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{userCompany.phone}</span>
                          </div>
                        )}
                        {userCompany.city && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{userCompany.city}{userCompany.country && `, ${userCompany.country}`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{shares.length}</p>
                      <p className="text-sm text-muted-foreground">Partages actifs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {new Set(shares.map(s => s.company_id)).size}
                      </p>
                      <p className="text-sm text-muted-foreground">Entreprises partagées</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {new Set(shares.map(s => s.shared_with_email)).size}
                      </p>
                      <p className="text-sm text-muted-foreground">Utilisateurs avec accès</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Liste des entreprises qui ont accès à votre fiche */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Entreprises avec accès à votre fiche</h2>
            
            {shares.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun accès accordé</h3>
                    <p className="text-muted-foreground mb-4">
                      Vous n'avez pas encore partagé votre entreprise avec d'autres utilisateurs.
                    </p>
                    <Link href="/companies">
                      <Button>
                        <Building className="h-4 w-4 mr-2" />
                        Gérer mon entreprise
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {shares.map((share) => (
                  <Card key={share.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                                                {/* Logo de l'entreprise qui a accès */}
                      <div className="flex-shrink-0">
                        {share.shared_with_company_logo ? (
                          <img
                            src={share.shared_with_company_logo}
                            alt={share.shared_with_company_name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>

                          {/* Informations du partage */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{share.shared_with_company_name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  A accès à votre entreprise : {share.company_name}
                                </p>
                                
                                {/* Informations sommaires de l'entreprise qui a accès */}
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span>{share.shared_with_company_email}</span>
                                  </div>
                                  {share.shared_with_company_phone && (
                                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span>{share.shared_with_company_phone}</span>
                                    </div>
                                  )}
                                  {share.shared_with_company_city && (
                                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{share.shared_with_company_city}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary" className="ml-2">
                                Actif
                              </Badge>
                            </div>

                            {/* Permissions et date */}
                            <div className="mt-3 space-y-2">
                              {/* Permissions */}
                              {share.permissions && share.permissions.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex flex-wrap gap-1">
                                    {share.permissions.map((permission, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {permission === 'view_company' ? 'Voir entreprise' : 
                                         permission === 'view_documents' ? 'Voir documents' : permission}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Date de partage */}
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Partagé le {format(new Date(share.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                                            {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPermissions(share)}
                        title="Gérer les permissions"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Permissions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeShare(share.id, share.shared_with_company_name || 'cette entreprise')}
                        disabled={revokingId === share.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Révoquer l'accès"
                      >
                        {revokingId === share.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Révoquer l'accès
                          </>
                        )}
                      </Button>
                    </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de gestion des permissions */}
      <PermissionsModal
        isOpen={permissionsModalOpen}
        onClose={handleClosePermissions}
        share={selectedShare}
        onUpdatePermissions={updatePermissions}
      />
    </MainLayout>
  )
}