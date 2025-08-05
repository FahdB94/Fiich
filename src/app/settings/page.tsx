'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Eye, 
  EyeOff,
  Lock,
  Key,
  Mail,
  Smartphone,
  Palette,
  Moon,
  Sun,
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface UserSettings {
  id: string
  email_notifications: boolean
  push_notifications: boolean
  language: string
  theme: 'light' | 'dark' | 'system'
  two_factor_enabled: boolean
  session_timeout: number
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Redirect to signin if not authenticated
  if (!loading && !user) {
    redirect('/auth/signin')
  }

  // Charger les paramètres utilisateur
  useEffect(() => {
    if (user) {
      fetchUserSettings()
    }
  }, [user])

  const fetchUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors du chargement des paramètres:', error)
        return
      }

      if (data) {
        setSettings(data)
      } else {
        // Créer des paramètres par défaut
        const defaultSettings: UserSettings = {
          id: user?.id || '',
          email_notifications: true,
          push_notifications: true,
          language: 'fr',
          theme: 'system',
          two_factor_enabled: false,
          session_timeout: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
    }
  }

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!user || !settings) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          [key]: value,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      setSettings({ ...settings, [key]: value })
      toast.success("Paramètre mis à jour !")
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error("Impossible de sauvegarder le paramètre.")
    } finally {
      setIsLoading(false)
    }
  }

  const changePassword = async () => {
    if (!user) return

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      toast.success("Mot de passe mis à jour avec succès.")

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
      toast.error("Impossible de changer le mot de passe.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Vous avez été déconnecté avec succès.")
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
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
                  <Settings className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Paramètres
              </h1>
              <p className="text-muted-foreground mt-2">
                Gérez vos préférences et votre sécurité
              </p>
            </div>
            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <Link href="/profile">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au profil
                </Link>
              </Button>
            </div>
          </div>

          {/* Paramètres de sécurité */}
          <Card className="relative overflow-hidden border-2 hover:border-red-200 transition-all duration-300 hover:shadow-lg">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-red-500 to-pink-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
              Sécurité
            </div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Sécurité du compte</CardTitle>
                  <CardDescription>
                    Gérez votre mot de passe et l'authentification
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Changement de mot de passe */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Changer le mot de passe
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Votre mot de passe actuel"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nouveau mot de passe"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmer le nouveau mot de passe"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={changePassword}
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="gap-2"
                    >
                      {isChangingPassword ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Changement...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Changer le mot de passe
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Authentification à deux facteurs */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Authentification à deux facteurs
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez une couche de sécurité supplémentaire à votre compte
                  </p>
                </div>
                <Switch
                  checked={settings?.two_factor_enabled || false}
                  onCheckedChange={(checked) => updateSetting('two_factor_enabled', checked)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Paramètres de notifications */}
          <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-all duration-300 hover:shadow-lg">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-emerald-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
              Notifications
            </div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Notifications</CardTitle>
                  <CardDescription>
                    Gérez vos préférences de notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Notifications par email
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Recevez des notifications par email
                  </p>
                </div>
                <Switch
                  checked={settings?.email_notifications || false}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                  disabled={isLoading}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Notifications push
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Recevez des notifications sur votre appareil
                  </p>
                </div>
                <Switch
                  checked={settings?.push_notifications || false}
                  onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Paramètres d'affichage */}
          <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-violet-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
              Affichage
            </div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Apparence</CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de l'application
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <Select
                  value={settings?.language || 'fr'}
                  onValueChange={(value) => updateSetting('language', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="theme">Thème</Label>
                <Select
                  value={settings?.theme || 'system'}
                  onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Clair
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Sombre
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Système
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Délai de session (minutes)</Label>
                <Select
                  value={settings?.session_timeout?.toString() || '30'}
                  onValueChange={(value) => updateSetting('session_timeout', parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un délai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions dangereuses */}
          <Card className="relative overflow-hidden border-2 border-red-200 bg-red-50">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-red-500 to-pink-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
              Danger
            </div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-red-900">Zone dangereuse</CardTitle>
                  <CardDescription className="text-red-700">
                    Actions irréversibles sur votre compte
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-red-900">Déconnexion</h3>
                  <p className="text-sm text-red-700">
                    Fermez votre session actuelle
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                      Se déconnecter
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSignOut} className="bg-red-600 hover:bg-red-700">
                        Se déconnecter
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Statut des paramètres */}
          <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Statut des paramètres</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Dernière sauvegarde</span>
                      <span className="text-sm text-gray-600">
                        {settings?.updated_at ? new Date(settings.updated_at).toLocaleString('fr-FR') : 'Jamais'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Statut</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        À jour
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
} 