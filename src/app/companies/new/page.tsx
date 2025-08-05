'use client'

import { useAuth } from '@/hooks/use-auth'
import { MainLayout } from '@/components/layout/main-layout'
import { CompanyForm } from '@/components/company/company-form'
import { Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default function NewCompanyPage() {
  const { user, loading } = useAuth()

  // Redirect to signin if not authenticated
  if (!loading && !user) {
    redirect('/auth/signin')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-muted rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/3 mx-auto mb-8"></div>
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" asChild>
              <Link href="/companies">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
          </div>

          <div className="text-center mb-8">
            <Building2 className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-3xl font-bold mb-2">Créer une nouvelle entreprise</h1>
            <p className="text-muted-foreground">
              Ajoutez les informations de votre entreprise pour commencer à partager votre fiche d'identité.
            </p>
          </div>

          {/* Company Creation Form */}
          <div className="flex justify-center">
            <CompanyForm mode="create" />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}