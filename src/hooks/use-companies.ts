'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Company } from '@/lib/types'
import { CompanyFormData } from '@/lib/validations'

export function useCompanies(userId?: string) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCompanies(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [userId])

  const createCompany = async (companyData: CompanyFormData) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          owner_id: userId,
        })
        .select()
        .single()

      if (error) throw error

      setCompanies(prev => [data, ...prev])
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateCompany = async (companyId: string, companyData: Partial<CompanyFormData>) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyId)
        .eq('owner_id', userId)
        .select()
        .single()

      if (error) throw error

      setCompanies(prev => 
        prev.map(company => 
          company.id === companyId ? data : company
        )
      )
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deleteCompany = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)
        .eq('owner_id', userId)

      if (error) throw error

      setCompanies(prev => prev.filter(company => company.id !== companyId))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const uploadLogo = async (companyId: string, file: File) => {
    try {
      const fileName = `logos/${companyId}/${Date.now()}-${file.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-files')
        .getPublicUrl(fileName)

      const { data, error } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', companyId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      setCompanies(prev => 
        prev.map(company => 
          company.id === companyId ? data : company
        )
      )

      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  return {
    companies,
    loading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
    uploadLogo,
    refetch: fetchCompanies,
  }
}

export function useCompany(companyId: string) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompany = async () => {
    if (!companyId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (error) throw error

      setCompany(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompany()
  }, [companyId])

  return {
    company,
    loading,
    error,
    refetch: fetchCompany,
  }
}