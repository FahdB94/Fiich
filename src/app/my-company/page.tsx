"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { MainLayout } from '@/components/layout/main-layout'

export default function MyCompanyRedirectPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    const go = async () => {
      if (loading) return
      if (!user) {
        router.replace('/auth/signin?next=/my-company')
        return
      }
      const { data: memberships } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1)
      if (memberships && memberships.length > 0) {
        router.replace(`/companies/${memberships[0].company_id}`)
        return
      }
      const { data: owned } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      if (owned && owned.length > 0) {
        router.replace(`/companies/${owned[0].id}`)
        return
      }
      router.replace('/companies/new')
    }
    go()
  }, [user, loading, router])

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-muted-foreground">Redirection en cours…</div>
      </div>
    </MainLayout>
  )
}


