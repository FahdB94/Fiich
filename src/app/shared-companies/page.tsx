'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { useInvitations } from '@/hooks/use-invitations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, Eye, Calendar, Users, AlertCircle } from 'lucide-react'
import { EnhancedSharedCompaniesList } from "@/components/sharing/enhanced-shared-companies-list"
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface CompanyShare {
  id: string
  company_id: string
  shared_with_email: string
  share_token: string
  is_active: boolean
  permissions: string[]
  created_at: string
  company_name: string
  siret?: string
}

export default function SharedCompaniesPage() {
  const { sharedCompanies, loading, error } = useInvitations()
  const [deduplicatedCompanies, setDeduplicatedCompanies] = useState<CompanyShare[]>([])

  useEffect(() => {
    if (sharedCompanies.length > 0) {
      // Récupérer les SIRET pour dédupliquer
      const fetchSirets = async () => {
        const companyIds = Array.from(new Set(sharedCompanies.map(share => share.company_id)))
        
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, siren, siret, logo_url')
          .in('id', companyIds)

        if (!companiesError && companies) {
          // Créer un map pour les informations des entreprises
          const companyMap = new Map(companies.map(c => [c.id, c]))
          
          // Enrichir les partages avec les informations des entreprises
          const enrichedShares = sharedCompanies.map(share => {
            const companyInfo = companyMap.get(share.company_id)
            return {
              ...share,
              siren: companyInfo?.siren,
              siret: companyInfo?.siret,
              logo_url: companyInfo?.logo_url
            }
          })
          
          // Dédupliquer par SIRET (garder le plus récent)
          const siretGroups = new Map<string, CompanyShare>()
          
          enrichedShares.forEach(share => {
            const siret = share.siret || share.siren || 'no-siret'
            const existing = siretGroups.get(siret)
            
            if (!existing || new Date(share.created_at) > new Date(existing.created_at)) {
              siretGroups.set(siret, share)
            }
          })
          
          setDeduplicatedCompanies(Array.from(siretGroups.values()))
        }
      }
      
      fetchSirets()
    } else {
      setDeduplicatedCompanies([])
    }
  }, [sharedCompanies])

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="text-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-full blur-xl opacity-20"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-600 p-4 rounded-full">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-900">Erreur de chargement</h3>
              <p className="text-red-800 mb-6 max-w-md mx-auto">
                Une erreur s'est produite lors du chargement des fiches partagées. 
                Veuillez réessayer plus tard.
              </p>
              <Button asChild className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white">
                <Link href="/dashboard">
                  Retour au tableau de bord
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <EnhancedSharedCompaniesList companies={deduplicatedCompanies} loading={loading} />
      </div>
    </MainLayout>
  )
}
