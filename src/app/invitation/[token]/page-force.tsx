'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, User, Mail, Clock, XCircle } from 'lucide-react'
import MainLayout from '@/components/layout/main-layout'

interface Invitation {
  id: string
  company_id: string
  invited_email: string
  invited_by: string
  invitation_token: string
  expires_at: string
  created_at: string
  updated_at: string
  company_name: string
  invited_by_email: string
  invited_by_name: string
  invited_by_first_name: string
}

export default function InvitationPageForce({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('')
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setToken(resolvedParams.token)
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (token) {
      loadData()
    }
  }, [token])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger l'utilisateur et l'invitation en parallèle
      const [userResult, invitationResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc('get_invitation_by_token', { token_param: token })
      ])

      // Traiter l'utilisateur
      if (userResult.error) {
        console.error('Erreur user:', userResult.error.message)
        setUser(null)
      } else {
        setUser(userResult.data.user)
        console.log('✅ User loaded:', userResult.data.user?.email)
      }

      // Traiter l'invitation
      if (invitationResult.error) {
        console.error('Erreur invitation:', invitationResult.error.message)
        setError('Invitation non trouvée ou expirée')
        return
      }

      if (!invitationResult.data || invitationResult.data.length === 0) {
        setError('Invitation non trouvée')
        return
      }

      setInvitation(invitationResult.data[0])
      console.log('✅ Invitation loaded:', invitationResult.data[0].invited_email)

    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    try {
      setUpdating(true)

      const { error } = await supabase
        .from('company_shares')
        .insert({
          company_id: invitation!.company_id,
          shared_with_email: invitation!.invited_email,
          share_token: generateShareToken(),
          is_active: true,
          permissions: ['view_company', 'view_documents']
        })

      if (error) {
        console.error('Erreur lors de l\'acceptation:', error)
        setError('Erreur lors de l\'acceptation de l\'invitation')
        return
      }

      router.push(`/shared/company/${invitation!.company_id}`)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors de l\'acceptation de l\'invitation')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeclineInvitation = async () => {
    try {
      setUpdating(true)

      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitation!.id)

      if (error) {
        console.error('Erreur lors du refus:', error)
        setError('Erreur lors du refus de l\'invitation')
        return
      }

      router.push('/dashboard')
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors du refus de l\'invitation')
    } finally {
      setUpdating(false)
    }
  }

  const generateShareToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const getStatusInfo = (expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()
    
    if (isExpired) {
      return {
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        label: 'Expirée',
        color: 'destructive' as const,
        description: 'Cette invitation a expiré'
      }
    } else {
      return {
        icon: <Clock className="h-5 w-5 text-yellow-500" />,
        label: 'En attente',
        color: 'secondary' as const,
        description: 'Vous pouvez accepter ou refuser cette invitation'
      }
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !invitation) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl">Invitation non trouvée</CardTitle>
              <CardDescription>
                {error || 'Cette invitation n\'existe pas ou a été supprimée'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Retour au tableau de bord
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const statusInfo = getStatusInfo(invitation.expires_at)
  const isExpired = new Date(invitation.expires_at) < new Date()
  const canAccept = !isExpired

  console.log('🔍 FORCE DEBUG:')
  console.log('   User:', user ? user.email : 'null')
  console.log('   Invitation:', invitation.invited_email)
  console.log('   isExpired:', isExpired)

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                {statusInfo.icon}
              </div>
              <CardTitle className="text-2xl">Invitation de partage</CardTitle>
              <CardDescription>
                {statusInfo.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Statut */}
              <div className="flex items-center justify-center">
                <Badge variant={statusInfo.color as any} className="text-sm">
                  {statusInfo.label}
                </Badge>
              </div>

              {/* Informations de l'entreprise */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                  <Building className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Entreprise</p>
                    <p className="text-sm text-muted-foreground">{invitation.company_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Invité par</p>
                    <p className="text-sm text-muted-foreground">
                      {invitation.invited_by_first_name && invitation.invited_by_name 
                        ? `${invitation.invited_by_first_name} ${invitation.invited_by_name}`
                        : invitation.invited_by_email || 'Utilisateur'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email invité</p>
                    <p className="text-sm text-muted-foreground">{invitation.invited_email}</p>
                  </div>
                </div>
              </div>

              {/* Date d'expiration */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}</p>
              </div>

              {/* Actions - FORCÉ pour utilisateur connecté */}
              {user && canAccept && (
                <div className="flex space-x-4">
                  <Button 
                    onClick={handleAcceptInvitation} 
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? 'Acceptation...' : 'Accepter l\'invitation'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDeclineInvitation}
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? 'Refus...' : 'Refuser'}
                  </Button>
                </div>
              )}

              {/* Actions pour utilisateurs non connectés */}
              {!user && (
                <div className="flex space-x-4">
                  <Link href="/auth/signin" className="flex-1">
                    <Button className="w-full">
                      Se connecter
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="flex-1">
                    <Button variant="outline" className="w-full">
                      S'inscrire
                    </Button>
                  </Link>
                </div>
              )}

              {/* Retour au dashboard */}
              <div className="text-center pt-4 border-t">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Retour au tableau de bord
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
} 