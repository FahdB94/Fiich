'use client'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthDebugPanel() {
  const { user, session, loading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testAuth = async () => {
    console.log('🔍 Test d\'authentification...')
    
    // Test de session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    // Test d'accès aux documents
    const { data: docsData, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .limit(1)

    const debugData = {
      useAuthHook: {
        user: user ? { id: user.id, email: user.email } : null,
        hasSession: !!session,
        loading
      },
      sessionTest: {
        hasSession: !!sessionData.session,
        user: sessionData.session?.user ? {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email
        } : null,
        error: sessionError?.message
      },
      documentsTest: {
        success: !docsError,
        error: docsError?.message,
        count: docsData?.length || 0
      }
    }

    setDebugInfo(debugData)
    console.log('Debug Info:', debugData)
  }

  if (loading) {
    return <div>Chargement du debug auth...</div>
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🔍 Debug Authentification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Status:</strong> {user ? '✅ Connecté' : '❌ Non connecté'}
        </div>
        
        {user && (
          <div>
            <strong>Utilisateur:</strong> {user.email} ({user.id})
          </div>
        )}

        <Button onClick={testAuth}>
          Tester l'Authentification
        </Button>

        {debugInfo && (
          <div className="mt-4 p-4 bg-muted rounded">
            <h4 className="font-semibold">Résultats du Test:</h4>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>Si vous voyez "❌ Non connecté", connectez-vous d'abord.</p>
          <p>Si vous êtes connecté mais que l'accès aux documents échoue, il y a un problème d'auth.</p>
        </div>
      </CardContent>
    </Card>
  )
}