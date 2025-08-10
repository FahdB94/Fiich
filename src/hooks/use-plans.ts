'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plan, CompanySubscription } from '@/lib/types'

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (fetchError) throw fetchError

      setPlans(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const refresh = () => {
    fetchPlans()
  }

  return {
    plans,
    loading,
    error,
    refresh
  }
}

export function useCompanySubscription(companyId?: string) {
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    if (!companyId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('company_subscriptions')
        .select(`
          *,
          plans (*)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      setSubscription(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelSubscription = async () => {
    if (!subscription) return

    try {
      const { error } = await supabase
        .from('company_subscriptions')
        .update({ 
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)

      if (error) throw error

      // Mettre à jour l'état local
      setSubscription(prev => prev ? { ...prev, cancel_at_period_end: true } : null)
    } catch (err: any) {
      console.error('Erreur lors de l\'annulation:', err)
      throw err
    }
  }

  const reactivateSubscription = async () => {
    if (!subscription) return

    try {
      const { error } = await supabase
        .from('company_subscriptions')
        .update({ 
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)

      if (error) throw error

      // Mettre à jour l'état local
      setSubscription(prev => prev ? { ...prev, cancel_at_period_end: false } : null)
    } catch (err: any) {
      console.error('Erreur lors de la réactivation:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [companyId])

  const refresh = () => {
    fetchSubscription()
  }

  return {
    subscription,
    loading,
    error,
    cancelSubscription,
    reactivateSubscription,
    refresh
  }
}
