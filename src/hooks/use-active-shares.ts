import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface ActiveShare {
  id: string
  company_id: string
  company_name: string
  company_email?: string
  company_phone?: string
  company_city?: string
  company_country?: string
  shared_with_email: string
  shared_with_company_name?: string
  shared_with_company_logo?: string
  shared_with_company_email?: string
  shared_with_company_phone?: string
  shared_with_company_city?: string
  created_at: string
  is_active: boolean
  logo_url?: string
  permissions: string[]
}

export function useActiveShares() {
  const [shares, setShares] = useState<ActiveShare[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveShares = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setShares([])
        return
      }

      // Récupérer les entreprises de l'utilisateur avec leurs partages actifs
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id,
          company_name,
          logo_url,
          email,
          phone,
          city,
          country,
          company_shares!inner(
            id,
            shared_with_email,
            created_at,
            is_active,
            permissions
          )
        `)
        .eq('user_id', user.id)
        .eq('company_shares.is_active', true)

      if (error) {
        console.error('Erreur lors de la récupération des partages:', error)
        setError('Erreur lors du chargement des partages')
        return
      }

      // Transformer les données pour un affichage plus simple
      const activeShares: ActiveShare[] = []
      
      for (const company of data || []) {
        for (const share of company.company_shares || []) {
          // Récupérer les informations de l'entreprise qui a accès
          const { data: sharedCompanyData } = await supabase
            .from('companies')
            .select('company_name, logo_url, email, phone, city')
            .eq('email', share.shared_with_email)
            .single()

          activeShares.push({
            id: share.id,
            company_id: company.id,
            company_name: company.company_name,
            company_email: company.email,
            company_phone: company.phone,
            company_city: company.city,
            company_country: company.country,
            shared_with_email: share.shared_with_email,
            shared_with_company_name: sharedCompanyData?.company_name || share.shared_with_email.split('@')[0],
            shared_with_company_logo: sharedCompanyData?.logo_url,
            shared_with_company_email: share.shared_with_email,
            shared_with_company_phone: sharedCompanyData?.phone,
            shared_with_company_city: sharedCompanyData?.city,
            created_at: share.created_at,
            is_active: share.is_active,
            logo_url: company.logo_url,
            permissions: share.permissions || []
          })
        }
      }

      setShares(activeShares)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors du chargement des partages')
    } finally {
      setLoading(false)
    }
  }

  const revokeShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('company_shares')
        .delete()
        .eq('id', shareId)

      if (error) {
        console.error('Erreur lors de la suppression:', error)
        return false
      }

      // Mettre à jour l'état local
      setShares(prev => prev.filter(share => share.id !== shareId))
      return true
    } catch (err) {
      console.error('Erreur:', err)
      return false
    }
  }

  const updatePermissions = async (shareId: string, permissions: string[]) => {
    try {
      const { error } = await supabase
        .from('company_shares')
        .update({ permissions })
        .eq('id', shareId)

      if (error) {
        console.error('Erreur lors de la mise à jour des permissions:', error)
        return false
      }

      // Mettre à jour l'état local
      setShares(prev => prev.map(share => 
        share.id === shareId ? { ...share, permissions } : share
      ))
      return true
    } catch (err) {
      console.error('Erreur:', err)
      return false
    }
  }

  useEffect(() => {
    fetchActiveShares()
  }, [])

  return {
    shares,
    loading,
    error,
    fetchActiveShares,
    revokeShare,
    updatePermissions
  }
} 