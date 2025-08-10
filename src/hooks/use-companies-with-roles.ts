'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CompanyWithRole, CompanyMember, Company } from '@/lib/types'

// Interface pour le résultat de la requête join
interface MemberWithCompany {
  company_id: string
  role: string
  companies: Company
}

export function useCompaniesWithRoles(userId?: string) {
  const [companies, setCompanies] = useState<CompanyWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompaniesWithRoles = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Récupérer les entreprises où l'utilisateur est propriétaire
      const { data: ownedCompanies, error: ownedError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', userId)

      if (ownedError) throw ownedError

      // Récupérer les entreprises où l'utilisateur est membre
      const { data: memberCompanies, error: memberError } = await supabase
        .from('company_members')
        .select(`
          company_id,
          role,
          companies (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active') as { data: MemberWithCompany[] | null, error: any }

      if (memberError) throw memberError

      // Combiner et formater les résultats
      const companiesWithRoles: CompanyWithRole[] = []

      // Ajouter les entreprises possédées avec le rôle 'owner'
      if (ownedCompanies) {
        companiesWithRoles.push(
          ...ownedCompanies.map(company => ({
            ...company,
            user_role: 'owner' as const
          }))
        )
      }

      // Ajouter les entreprises où l'utilisateur est membre
      if (memberCompanies) {
        memberCompanies.forEach(member => {
          // Éviter les doublons si l'utilisateur est à la fois propriétaire et membre
          const existingCompany = companiesWithRoles.find(c => c.id === member.company_id)
          if (!existingCompany) {
            companiesWithRoles.push({
              ...member.companies,
              user_role: member.role as 'admin' | 'member' | 'viewer'
            })
          }
        })
      }

      // Trier par date de création (plus récent en premier)
      companiesWithRoles.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setCompanies(companiesWithRoles)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompaniesWithRoles()
  }, [userId])

  const refresh = () => {
    fetchCompaniesWithRoles()
  }

  return {
    companies,
    loading,
    error,
    refresh
  }
}
