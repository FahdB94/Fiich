import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateShareToken } from "@/lib/utils/tokens"

interface Invitation {
  id: string
  company_id: string
  invited_email: string
  invited_by: string
  invitation_token: string
  expires_at: string
  created_at: string
  updated_at: string
  company_name: string
  invited_by_email: string
  invited_by_name: string
  invited_by_first_name: string
}

interface CompanyShare {
  id: string
  company_id: string
  shared_with_email: string
  share_token: string
  is_active: boolean
  permissions: string[]
  created_at: string
  company_name: string
}

export function useInvitations() {
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([])
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([])
  const [sharedCompanies, setSharedCompanies] = useState<CompanyShare[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Récupérer les invitations envoyées
  const fetchSentInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          companies(company_name)
        `)
        .eq('invited_by', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des invitations envoyées:', error)
        // Ne pas afficher d'erreur pour les invitations envoyées sur cette page
        return
      }

      const enrichedData = data?.map(invitation => ({
        ...invitation,
        company_name: invitation.companies?.company_name || 'Entreprise inconnue'
      })) || []

      setSentInvitations(enrichedData)
    } catch (err) {
      console.error('Erreur:', err)
      // Ne pas afficher d'erreur pour les invitations envoyées sur cette page
    }
  }

  // Récupérer les invitations reçues
  const fetchReceivedInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          companies(company_name)
        `)
        .eq('invited_email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des invitations reçues:', error)
        // Ne pas afficher d'erreur pour les invitations reçues sur cette page
        return
      }

      const enrichedData = data?.map(invitation => ({
        ...invitation,
        company_name: invitation.companies?.company_name || 'Entreprise inconnue'
      })) || []

      setReceivedInvitations(enrichedData)
    } catch (err) {
      console.error('Erreur:', err)
      // Ne pas afficher d'erreur pour les invitations reçues sur cette page
    }
  }

  // Récupérer les entreprises partagées avec l'utilisateur
  const fetchSharedCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('company_shares')
        .select(`
          *,
          companies(company_name)
        `)
        .eq('shared_with_email', user.email)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des entreprises partagées:', error)
        // Ne pas afficher d'erreur, juste mettre une liste vide
        setSharedCompanies([])
        return
      }

      const enrichedData = data?.map(share => ({
        ...share,
        company_name: share.companies?.company_name || 'Entreprise inconnue'
      })) || []

      setSharedCompanies(enrichedData)
    } catch (err) {
      console.error('Erreur:', err)
      // Ne pas afficher d'erreur, juste mettre une liste vide
      setSharedCompanies([])
    }
  }

  // Supprimer une invitation envoyée
  const deleteSentInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)

      if (error) {
        console.error('Erreur lors de la suppression:', error)
        throw new Error('Erreur lors de la suppression de l\'invitation')
      }

      // Mettre à jour la liste
      setSentInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      return true
    } catch (err) {
      console.error('Erreur:', err)
      throw err
    }
  }

  // Accepter une invitation
  const acceptInvitation = async (invitation: Invitation) => {
    try {
      // Créer le partage
      const { error: shareError } = await supabase
        .from('company_shares')
        .insert({
          company_id: invitation.company_id,
          shared_with_email: invitation.invited_email,
          share_token: generateShareToken(),
          is_active: true,
          permissions: ['view_company', 'view_documents']
        })

      if (shareError) {
        console.error('Erreur lors de l\'acceptation:', shareError)
        throw new Error('Erreur lors de l\'acceptation de l\'invitation')
      }

      // Supprimer l'invitation
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitation.id)

      if (deleteError) {
        console.error('Erreur lors de la suppression de l\'invitation:', deleteError)
      }

      // Mettre à jour les listes
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitation.id))
      await fetchSharedCompanies()

      return true
    } catch (err) {
      console.error('Erreur:', err)
      throw err
    }
  }

  // Refuser une invitation
  const declineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)

      if (error) {
        console.error('Erreur lors du refus:', error)
        throw new Error('Erreur lors du refus de l\'invitation')
      }

      // Mettre à jour la liste
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      return true
    } catch (err) {
      console.error('Erreur:', err)
      throw err
    }
  }

  // Charger toutes les données
  const loadAllData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        fetchSentInvitations(),
        fetchReceivedInvitations(),
        fetchSharedCompanies()
      ])
    } catch (err) {
      console.error('Erreur lors du chargement:', err)
      // Ne pas afficher d'erreur globale, laisser les fonctions individuelles gérer
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  return {
    sentInvitations,
    receivedInvitations,
    sharedCompanies,
    loading,
    error,
    deleteSentInvitation,
    acceptInvitation,
    declineInvitation,
    refresh: loadAllData
  }
}
