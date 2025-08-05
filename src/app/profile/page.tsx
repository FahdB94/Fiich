'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  Key,
  Bell,
  Globe,
  Building,
  FileText,
  Users,
  Activity,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  address?: string
  company?: string
  job_title?: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    companies: 0,
    documents: 0,
    shares: 0
  })
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    company: '',
    job_title: '',
    bio: ''
  })

  // Redirect to signin if not authenticated
  if (!loading && !user) {
    redirect('/auth/signin')
  }

  // Charger le profil utilisateur
  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchUserStats()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors du chargement du profil:', error)
        return
      }

      if (data) {
        setProfile(data)
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          company: data.company || '',
          job_title: data.job_title || '',
          bio: data.bio || ''
        })
      } else {
        // Créer un profil par défaut
        const defaultProfile: UserProfile = {
          id: user?.id || '',
          email: user?.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(defaultProfile)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      // D'abord récupérer les entreprises de l'utilisateur
      const { data: userCompanies } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user?.id)

      const companyIds = userCompanies?.map(c => c.id) || []

      if (companyIds.length === 0) {
        setStats({ companies: 0, documents: 0, shares: 0 })
        return
      }

      const [documentsResult, sharesResult] = await Promise.all([
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .in('company_id', companyIds),
        supabase
          .from('company_shares')
          .select('*', { count: 'exact', head: true })
          .in('company_id', companyIds)
          .eq('is_active', true)
      ])

      setStats({
        companies: companyIds.length,
        documents: documentsResult.count || 0,
        shares: sharesResult.count || 0
      })
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...formData,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      toast.success("Profil mis à jour avec succès")

      setIsEditing(false)
      fetchUserProfile()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error("Impossible de sauvegarder le profil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        company: profile.company || '',
        job_title: profile.job_title || '',
        bio: profile.bio || ''
      })
    }
    setIsEditing(false)
  }

  const getInitials = (name?: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U'
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
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
            <div className="grid gap-6 md:grid-cols-2">
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
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Mon Profil
              </h1>
              <p className="text-muted-foreground mt-2">
                Gérez vos informations personnelles
              </p>
            </div>
            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au tableau de bord
                </Link>
              </Button>
            </div>
          </div>

          {/* Avatar et informations principales */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
              Profil
            </div>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">
                      {profile?.full_name || 'Utilisateur'}
                    </h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Informations personnelles</h3>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={handleSave}
                            disabled={isLoading}
                            className="gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancel}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => setIsEditing(true)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Modifier
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet</Label>
                      {isEditing ? (
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          placeholder="Votre nom complet"
                        />
                      ) : (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          {profile?.full_name || 'Non renseigné'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Votre numéro de téléphone"
                        />
                      ) : (
                        <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {profile?.phone || 'Non renseigné'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Entreprise</Label>
                      {isEditing ? (
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Votre entreprise"
                        />
                      ) : (
                        <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {profile?.company || 'Non renseigné'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job_title">Poste</Label>
                      {isEditing ? (
                        <Input
                          id="job_title"
                          value={formData.job_title}
                          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                          placeholder="Votre poste"
                        />
                      ) : (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          {profile?.job_title || 'Non renseigné'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Adresse</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Votre adresse"
                        />
                      ) : (
                        <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {profile?.address || 'Non renseigné'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Parlez-nous de vous..."
                          rows={3}
                        />
                      ) : (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          {profile?.bio || 'Aucune bio renseignée'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques utilisateur */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                Entreprises
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.companies}</p>
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
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.documents}</p>
                    <p className="text-sm text-muted-foreground">Fichiers uploadés</p>
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
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.shares}</p>
                    <p className="text-sm text-muted-foreground">Partages actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations du compte */}
          <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Informations du compte</CardTitle>
                  <CardDescription>
                    Détails de votre compte et sécurité
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Email</span>
                  </div>
                  <span className="text-sm text-gray-600">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Membre depuis</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {profile?.created_at ? format(new Date(profile.created_at), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Dernière activité</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {profile?.updated_at ? format(new Date(profile.updated_at), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Statut</span>
                  </div>
                  <Badge variant="secondary">Actif</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sécurité</h3>
                    <p className="text-sm text-muted-foreground">Gérer le mot de passe</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/settings">
                    Accéder
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Bell className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Préférences</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/settings">
                    Configurer
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Langue</h3>
                    <p className="text-sm text-muted-foreground">Français</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/settings">
                    Changer
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 