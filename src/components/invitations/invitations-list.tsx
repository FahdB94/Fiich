'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useInvitations } from '@/hooks/use-invitations'
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  User, 
  Building, 
  Calendar,
  AlertTriangle,
  Users,
  Share2
} from 'lucide-react'
import Link from 'next/link'

export default function InvitationsList() {
  const { 
    sentInvitations, 
    receivedInvitations, 
    sharedCompanies,
    loading, 
    error, 
    deleteSentInvitation, 
    acceptInvitation, 
    declineInvitation,
    refresh 
  } = useInvitations()
  
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAcceptInvitation = async (invitation: any) => {
    setProcessingId(invitation.id)
    try {
      await acceptInvitation(invitation)
      toast.success('Invitation acceptée avec succès !')
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation de l\'invitation')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    setProcessingId(invitationId)
    try {
      await declineInvitation(invitationId)
      toast.success('Invitation refusée')
    } catch (error) {
      toast.error('Erreur lors du refus de l\'invitation')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteSentInvitation = async (invitationId: string) => {
    setProcessingId(invitationId)
    try {
      await deleteSentInvitation(invitationId)
      toast.success('Invitation supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'invitation')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusInfo = (expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()
    if (isExpired) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        label: 'Expirée',
        color: 'destructive' as const,
        description: 'Cette invitation a expiré'
      }
    } else {
      return {
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
        label: 'En attente',
        color: 'secondary' as const,
        description: 'En attente de réponse'
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des invitations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refresh}>Réessayer</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des invitations</h2>
          <p className="text-muted-foreground">
            Gérez vos invitations envoyées et reçues
          </p>
        </div>
        <Button onClick={refresh} variant="outline">
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Reçues ({receivedInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Envoyées ({sentInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Partagées ({sharedCompanies.length})
          </TabsTrigger>
        </TabsList>

        {/* Invitations reçues */}
        <TabsContent value="received" className="space-y-4">
          {receivedInvitations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune invitation reçue</h3>
                  <p className="text-muted-foreground">
                    Vous n'avez pas encore reçu d'invitations
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {receivedInvitations.map((invitation) => {
                const statusInfo = getStatusInfo(invitation.expires_at)
                const isExpired = new Date(invitation.expires_at) < new Date()
                
                return (
                  <Card key={invitation.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{invitation.company_name}</CardTitle>
                            <CardDescription>
                              Invité par {invitation.invited_by_first_name} {invitation.invited_by_name}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={statusInfo.color}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        
                        {!isExpired && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAcceptInvitation(invitation)}
                              disabled={processingId === invitation.id}
                              className="flex-1"
                            >
                              {processingId === invitation.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Acceptation...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accepter
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeclineInvitation(invitation.id)}
                              disabled={processingId === invitation.id}
                              className="flex-1"
                            >
                              {processingId === invitation.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Refus...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Refuser
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Invitations envoyées */}
        <TabsContent value="sent" className="space-y-4">
          {sentInvitations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune invitation envoyée</h3>
                  <p className="text-muted-foreground">
                    Vous n'avez pas encore envoyé d'invitations
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sentInvitations.map((invitation) => {
                const statusInfo = getStatusInfo(invitation.expires_at)
                
                return (
                  <Card key={invitation.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{invitation.company_name}</CardTitle>
                            <CardDescription>
                              Envoyée à {invitation.invited_email}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.color}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSentInvitation(invitation.id)}
                            disabled={processingId === invitation.id}
                          >
                            {processingId === invitation.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Entreprises partagées */}
        <TabsContent value="shared" className="space-y-4">
          {sharedCompanies.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune entreprise partagée</h3>
                  <p className="text-muted-foreground">
                    Vous n'avez pas encore accès à des entreprises partagées
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sharedCompanies.map((share) => (
                <Card key={share.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{share.company_name}</CardTitle>
                          <CardDescription>
                            Accès partagé - Permissions: {share.permissions.join(', ')}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="default">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Actif
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/shared/company/${share.company_id}`}>
                      <Button className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Voir l'entreprise
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 