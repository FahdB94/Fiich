'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// Force dynamic rendering to avoid build-time Supabase access
export const dynamic = 'force-dynamic'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building, Mail, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

interface Invitation {
  id: string
  company_id: string
  invited_email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  created_at: string
  company: {
    company_name: string
    email: string
  }
  inviter: {
    email: string
    first_name?: string
    last_name?: string
  }
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchInvitations = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Récupérer les invitations reçues par email
        const { data, error } = await supabase
          .from('invitations')
          .select(`
            *,
            company:companies(company_name, email),
            inviter:users!invitations_invited_by_fkey(email, first_name, last_name)
          `)
          .eq('invited_email', user.email)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        setInvitations(data || [])
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des invitations')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitations()
  }, [user, supabase])

  const acceptInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId)

      if (error) {
        throw error
      }

      // Mettre à jour l'état local
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'accepted' as const }
            : inv
        )
      )

      // Rediriger vers l'entreprise partagée
      const invitation = invitations.find(inv => inv.id === invitationId)
      if (invitation) {
        window.location.href = `/shared/company/${invitation.company_id}`
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'acceptation')
    }
  }

  const rejectInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)

      if (error) {
        throw error
      }

      // Mettre à jour l'état local
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'revoked' as const }
            : inv
        )
      )
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

  const canAccept = (invitation: Invitation) => {
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
                          {invitation.company.company_name}
                        </CardTitle>
                        <CardDescription>
                          Invitation de {invitation.inviter.first_name && invitation.inviter.last_name
                            ? `${invitation.inviter.first_name} ${invitation.inviter.last_name}`
                            : invitation.inviter.email}
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
                          <p className="text-muted-foreground">{invitation.company.company_name}</p>
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
                            <Link href={`/shared/company/${invitation.company_id}`}>
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