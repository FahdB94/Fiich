'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building, Mail, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

type ApiInvitation = {
  id: string
  invitation_token?: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  created_at: string
  company?: { id?: string; company_name?: string }
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<ApiInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchInvitations = async () => {
      if (!user) return
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/invitations')
        if (!res.ok) throw new Error('Erreur API invitations')
        const json = await res.json()
        const received: ApiInvitation[] = json?.data?.received || []
        setInvitations(received)
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des invitations')
      } finally {
        setLoading(false)
      }
    }
    fetchInvitations()
  }, [user])

  const acceptInvitation = async (invitationId: string) => {
    try {
      // délégué au flux /invitation/[token] si disponible
      const inv = invitations.find(i => i.id === invitationId)
      if (!inv?.invitation_token) return
      window.location.href = `/invitation/${inv.invitation_token}`
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'acceptation')
    }
  }

  const rejectInvitation = async (invitationId: string) => {
    try {
      // simple mise à jour locale (l'API aura un endpoint dédié plus tard)
      setInvitations(prev => prev.map(inv => inv.id === invitationId ? { ...inv, status: 'revoked' } : inv))
    } catch (err: any) {
      setError(err.message || 'Erreur lors du refus')
    }
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()
    
    if (isExpired && status === 'pending') {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Expirée</Badge>
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> En attente</Badge>
      case 'accepted':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Acceptée</Badge>
      case 'expired':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Expirée</Badge>
      case 'revoked':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Refusée</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const canAccept = (invitation: ApiInvitation) => {
    return invitation.status === 'pending' && new Date(invitation.expires_at) > new Date()
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
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
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Invitations reçues
            </h1>
            <p className="text-muted-foreground">
              Gérez les invitations à consulter des entreprises
            </p>
          </div>

          {/* Invitations */}
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Aucune invitation
                </h3>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas encore reçu d'invitations à consulter des entreprises.
                </p>
                <Button asChild>
                  <Link href="/companies">
                    Voir mes entreprises
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          {invitation.company?.company_name || 'Entreprise'}
                        </CardTitle>
                        <CardDescription>
                          Invitation reçue
                        </CardDescription>
                      </div>
                      {getStatusBadge(invitation.status, invitation.expires_at)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Entreprise :</span>
                          <p className="text-muted-foreground">{invitation.company?.company_name || '—'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Expire le :</span>
                          <p className="text-muted-foreground">
                            {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {canAccept(invitation) && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => acceptInvitation(invitation.id)}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accepter l'invitation
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => rejectInvitation(invitation.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Refuser
                          </Button>
                        </div>
                      )}

                      {invitation.status === 'accepted' && (
                        <div className="flex gap-2">
                          <Button asChild className="flex-1">
                            <Link href={`/shared/company/${invitation.company?.id || ''}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Voir l'entreprise
                            </Link>
                          </Button>
                        </div>
                      )}

                      {(invitation.status === 'expired' || invitation.status === 'revoked') && (
                        <Alert>
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            {invitation.status === 'expired' 
                              ? 'Cette invitation a expiré.'
                              : 'Vous avez refusé cette invitation.'
                            }
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </MainLayout>
  )
} 