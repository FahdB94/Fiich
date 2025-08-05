'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCcw, Home, Mail } from 'lucide-react'
import Link from 'next/link'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary?: () => void
  context?: string
}

export function ErrorFallback({ error, resetErrorBoundary, context }: ErrorFallbackProps) {
  useEffect(() => {
    // Log l'erreur pour le debugging
    console.error('Error caught by ErrorFallback:', error)
    console.error('Context:', context)
  }, [error, context])

  const isDevelopment = process.env.NODE_ENV === 'development'
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isAuthError = error.message.includes('auth') || error.message.includes('unauthorized')

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">
            {isNetworkError && 'Problème de connexion'}
            {isAuthError && 'Erreur d\'authentification'}
            {!isNetworkError && !isAuthError && 'Une erreur est survenue'}
          </CardTitle>
          <CardDescription>
            {isNetworkError && 'Vérifiez votre connexion internet et réessayez.'}
            {isAuthError && 'Votre session a expiré. Veuillez vous reconnecter.'}
            {!isNetworkError && !isAuthError && 'Nous nous excusons pour la gêne occasionnée.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isDevelopment && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Détails de l'erreur (mode développement)
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md font-mono text-xs overflow-auto">
                <p><strong>Message:</strong> {error.message}</p>
                {context && <p><strong>Contexte:</strong> {context}</p>}
                {error.stack && (
                  <div className="mt-2">
                    <strong>Stack trace:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-col gap-2">
            {resetErrorBoundary && (
              <Button onClick={resetErrorBoundary} className="w-full">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            )}

            {isAuthError ? (
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/signin">
                  Se reconnecter
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
            )}

            <Button variant="ghost" asChild className="w-full">
              <Link href="mailto:support@fiich-app.com">
                <Mail className="w-4 h-4 mr-2" />
                Contacter le support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Composant d'erreur simple pour les sections
export function SectionError({ 
  title = 'Erreur de chargement', 
  message = 'Impossible de charger cette section.',
  onRetry 
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      )}
    </div>
  )
}

// Composant pour les états vides
export function EmptyState({
  icon: Icon = AlertTriangle,
  title,
  message,
  action
}: {
  icon?: any
  title: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Icon className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {action}
    </div>
  )
}