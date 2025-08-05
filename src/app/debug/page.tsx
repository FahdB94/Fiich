'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { AuthDebugPanel } from '@/components/debug/auth-debug'

export default function DebugPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🔧 Page de Debug</h1>
          
          <div className="space-y-8">
            <AuthDebugPanel />
            
            <div className="text-sm text-muted-foreground">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Vérifiez votre statut de connexion ci-dessus</li>
                <li>Si vous n'êtes pas connecté, allez sur <a href="/auth/signin" className="text-primary underline">/auth/signin</a></li>
                <li>Revenez ici et cliquez sur "Tester l'Authentification"</li>
                <li>Vérifiez les résultats pour diagnostiquer le problème</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}