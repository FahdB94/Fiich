'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, User, Mail, Clock, XCircle, Lock, UserPlus } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'

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

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('')
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  })
  const router = useRouter()

  // Utilise le client Supabase configuré

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

  // Fonction avec meilleure détection de l'utilisateur
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Chargement pour token:', token)

      // 1. Charger l'invitation
      const invitationResult = await supabase.rpc('get_invitation_by_token', { token_param: token })

      if (invitationResult.error) {
        console.error('❌ Erreur invitation:', invitationResult.error.message)
        setError('Invitation non trouvée')
        return
      }

      if (!invitationResult.data || invitationResult.data.length === 0) {
        setError('Invitation non trouvée')
        return
      }

      setInvitation(invitationResult.data[0])
      console.log('✅ Invitation chargée:', invitationResult.data[0].invited_email)

      // 2. Charger l'utilisateur avec plusieurs méthodes
      await loadUser()

    } catch (err) {
      console.error('❌ Erreur générale:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  // Fonction dédiée pour charger l'utilisateur
  const loadUser = async () => {
    console.log('🔍 Tentative de récupération de l\'utilisateur...')
    
    try {
      // Méthode 1: getUser()
      const userResult = await supabase.auth.getUser()
      console.log('📥 getUser() résultat:', userResult)
      
      if (userResult.data.user) {
        setUser(userResult.data.user)
        console.log('✅ Utilisateur connecté (getUser):', userResult.data.user.email)
        return
      }

      // Méthode 2: getSession()
      const sessionResult = await supabase.auth.getSession()
      console.log('📥 getSession() résultat:', sessionResult)
      
      if (sessionResult.data.session?.user) {
        setUser(sessionResult.data.session.user)
        console.log('✅ Utilisateur connecté (getSession):', sessionResult.data.session.user.email)
        return
      }

      // Méthode 3: Vérifier le localStorage
      const storedSession = localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/https?:\/\//, '').replace(/\./g, '-') + '-auth-token')
      console.log('📥 Session localStorage:', storedSession ? 'Présente' : 'Absente')
      
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession)
          if (parsedSession.currentSession?.user) {
            setUser(parsedSession.currentSession.user)
            console.log('✅ Utilisateur connecté (localStorage):', parsedSession.currentSession.user.email)
            return
          }
        } catch (e) {
          console.log('❌ Erreur parsing localStorage:', e)
        }
      }

      // Aucun utilisateur trouvé
      setUser(null)
      console.log('ℹ️  Aucun utilisateur connecté trouvé')

    } catch (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError)
      setUser(null)
    }
  }

  const handleAcceptInvitation = async () => {
    try {
      setUpdating(true)
      console.log('🔄 Début acceptation invitation...')

      // 1. Vérifier que l'utilisateur est bien connecté
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      if (userError || !currentUser) {
        console.error('❌ Utilisateur non connecté:', userError)
        setError('Vous devez être connecté')
        return
      }

      console.log('✅ Utilisateur vérifié:', currentUser.email)

      // 2. Créer le partage
      const { error: shareError } = await supabase
        .from('company_shares')
        .insert({
          company_id: invitation!.company_id,
          shared_with_email: invitation!.invited_email,
          share_token: generateShareToken(),
          is_active: true,
          permissions: ['view_company', 'view_documents']
        })

      if (shareError) {
        console.error('❌ Erreur création partage:', shareError.message)
        setError('Erreur lors de l\'acceptation: ' + shareError.message)
        return
      }

      console.log('✅ Partage créé')

      // 3. Supprimer l'invitation
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitation!.id)

      if (deleteError) {
        console.error('❌ Erreur suppression invitation:', deleteError.message)
        // Ne pas bloquer si la suppression échoue
      } else {
        console.log('✅ Invitation supprimée')
      }

      console.log('✅ Invitation acceptée avec succès')
      router.push(`/shared/company/${invitation!.company_id}`)
    } catch (err) {
      console.error('❌ Erreur générale:', err)
      setError('Erreur lors de l\'acceptation')
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
        console.error('❌ Erreur refus:', error.message)
        setError('Erreur lors du refus')
        return
      }

      console.log('✅ Invitation refusée')
      router.push('/dashboard')
    } catch (err) {
      console.error('❌ Erreur:', err)
      setError('Erreur lors du refus')
    } finally {
      setUpdating(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      // Recharger les données
      await loadData()
      setShowAuthForm(false)
    } catch (err) {
      setAuthError('Erreur lors de la connexion')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: {
          data: {
            first_name: authForm.firstName,
            last_name: authForm.lastName
          }
        }
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      setAuthError('Vérifiez votre email pour confirmer votre compte')
    } catch (err) {
      setAuthError('Erreur lors de l\'inscription')
    }
  }

  const handleAuthSubmit = authMode === 'signin' ? handleSignIn : handleSignUp

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

  // États de chargement
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de l'invitation...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Erreur ou invitation non trouvée
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

  // LOGIQUE CORRIGÉE AVEC DÉTECTION ROBUSTE DE L'UTILISATEUR
  const isUserConnected = !!user
  const isEmailMatching = user && user.email === invitation.invited_email
  const isExpired = new Date(invitation.expires_at) < new Date()
  const canAccept = !isExpired

  console.log('🔍 ÉTAT FINAL:')
  console.log('   Utilisateur connecté:', isUserConnected)
  console.log('   Email utilisateur:', user?.email)
  console.log('   Email invitation:', invitation.invited_email)
  console.log('   Emails correspondent:', isEmailMatching)
  console.log('   Invitation expirée:', isExpired)

  // CAS 1: Utilisateur non connecté → Formulaire d'authentification
  if (!isUserConnected) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Accéder à votre invitation</CardTitle>
                <CardDescription>
                  Vous devez vous connecter ou créer un compte pour accéder à cette invitation
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Informations de l'invitation */}
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Entreprise</p>
                      <p className="text-xs text-muted-foreground">{invitation.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Invité par</p>
                      <p className="text-xs text-muted-foreground">
                        {invitation.invited_by_first_name && invitation.invited_by_name 
                          ? `${invitation.invited_by_first_name} ${invitation.invited_by_name}`
                          : invitation.invited_by_email || 'Utilisateur'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Email invité</p>
                      <p className="text-xs text-muted-foreground">{invitation.invited_email}</p>
                    </div>
                  </div>
                </div>

                {/* Formulaire d'authentification */}
                {showAuthForm ? (
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authMode === 'signup' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">Prénom</Label>
                            <Input
                              id="firstName"
                              type="text"
                              value={authForm.firstName}
                              onChange={(e) => setAuthForm({...authForm, firstName: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Nom</Label>
                            <Input
                              id="lastName"
                              type="text"
                              value={authForm.lastName}
                              onChange={(e) => setAuthForm({...authForm, lastName: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={authForm.password}
                        onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                        required
                      />
                    </div>

                    {authError && (
                      <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                        {authError}
                      </div>
                    )}

                    <Button type="submit" className="w-full">
                      {authMode === 'signin' ? 'Se connecter' : 'Créer un compte'}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
                          setAuthError(null)
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        {authMode === 'signin' 
                          ? 'Pas de compte ? Créer un compte' 
                          : 'Déjà un compte ? Se connecter'
                        }
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      onClick={() => {
                        setAuthForm({...authForm, email: invitation.invited_email})
                        setAuthMode('signin')
                        setShowAuthForm(true)
                      }}
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Se connecter
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setAuthForm({...authForm, email: invitation.invited_email})
                        setAuthMode('signup')
                        setShowAuthForm(true)
                      }}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Créer un compte
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  // CAS 2: Utilisateur connecté mais mauvais email → Accès non autorisé
  if (isUserConnected && !isEmailMatching) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Accès non autorisé</h2>
                  <p className="text-muted-foreground mb-4">
                    Cette invitation est destinée à {invitation.invited_email}, 
                    mais vous êtes connecté avec {user.email}
                  </p>
                  <Button onClick={() => supabase.auth.signOut()}>
                    Se déconnecter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  // CAS 3: Utilisateur connecté avec bon email → Afficher Accepter/Refuser
  const statusInfo = getStatusInfo(invitation.expires_at)

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

              {/* Actions - Accepter/Refuser (FORCÉ pour tous) */}
              {canAccept && (
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