'use client'

import { useAuth } from '@/hooks/use-auth'
import { useCompanies } from '@/hooks/use-companies'
import { MainLayout } from '@/components/layout/main-layout'
import { CompanyForm } from '@/components/company/company-form'
import { Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect, useParams } from 'next/navigation'
import { useMemo } from 'react'

export default function EditCompanyPage() {
  const { user, loading } = useAuth()
  const { companies, loading: companiesLoading } = useCompanies(user?.id)
  const params = useParams()
  const companyId = params.id as string

  // Redirect to signin if not authenticated
  if (!loading && !user) {
    redirect('/auth/signin')
  }

  const company = useMemo(() => 
    companies.find(c => c.id === companyId), 
    [companies, companyId]
  )

  if (loading || companiesLoading) {
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

  if (!company) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Entreprise non trouvée</h2>
            <p className="text-muted-foreground mb-8">
              Cette entreprise n'existe pas ou vous n'avez pas les droits pour la modifier.
            </p>
            <Button asChild>
              <Link href="/companies">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux entreprises
              </Link>
            </Button>
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
              <Link href={`/companies/${company.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
          </div>

          <div className="text-center mb-8">
            <Building2 className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-3xl font-bold mb-2">Modifier l'entreprise</h1>
            <p className="text-muted-foreground">
              Modifiez les informations de <strong>{company.company_name}</strong>
            </p>
          </div>

          {/* Company Edit Form */}
          <div className="flex justify-center">
            <CompanyForm mode="edit" company={company} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}