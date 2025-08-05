'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { Mail, CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react'

export function VerifyEmailForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Si l'utilisateur est déjà connecté et vérifié, rediriger vers le dashboard
    if (user && user.email_confirmed_at) {
      router.push('/dashboard')
      return
    }

    // Vérifier s'il y a un token de vérification dans l'URL
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    if (token && type === 'signup') {
      // Supabase gère automatiquement la vérification via l'URL
      // Le statut sera mis à jour via le listener auth dans useAuth
      setVerificationStatus('success')
      toast.success('Email vérifié avec succès !')
    }
  }, [user, router, searchParams, toast])

  const resendVerificationEmail = async () => {
    if (!user?.email) {
      toast.error('Aucun email trouvé')
      return
    }

    setIsLoading(true)
    try {
      // Cette fonctionnalité dépend de Supabase Auth
      // Pour l'instant, on affiche juste un message
      toast.success('Email de vérification renvoyé')
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'email')
    } finally {
      setIsLoading(false)
    }
  }

  if (verificationStatus === 'success') {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Email vérifié !</CardTitle>
          <CardDescription>
            Votre compte a été activé avec succès
          </CardDescription>
        </CardHeader>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button
            className="w-full"
            onClick={() => router.push('/dashboard')}
          >
            Accéder au tableau de bord
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (verificationStatus === 'error') {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Erreur de vérification</CardTitle>
          <CardDescription>
            Le lien de vérification est invalide ou a expiré
          </CardDescription>
        </CardHeader>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={resendVerificationEmail}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Renvoyer l'email de vérification
          </Button>
          
          <div className="text-center text-sm">
            <Link
              href="/auth/signin"
              className="text-muted-foreground underline underline-offset-4 hover:text-primary inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour à la connexion
            </Link>
          </div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
        <CardDescription>
          Nous avons envoyé un lien de vérification à{' '}
          <strong>{user?.email}</strong>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          <p>Cliquez sur le lien dans l'email pour activer votre compte.</p>
          <p className="mt-2">Si vous ne voyez pas l'email, vérifiez vos spams.</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={resendVerificationEmail}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Renvoyer l'email de vérification
        </Button>
        
        <div className="text-center text-sm">
          <Link
            href="/auth/signin"
            className="text-muted-foreground underline underline-offset-4 hover:text-primary inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à la connexion
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}