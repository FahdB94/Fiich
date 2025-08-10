'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export function useMyCompany() {
  const { user } = useAuth()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      try {
        // 1) Essayer via membership
        const { data: memberships } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .limit(1)

        if (memberships && memberships.length > 0) {
          setCompanyId(memberships[0].company_id)
          return
        }

        // 2) Fallback: entreprise possédée (OWNER via user_id)
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (companies && companies.length > 0) {
          setCompanyId(companies[0].id)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  return { companyId, loading }
}



