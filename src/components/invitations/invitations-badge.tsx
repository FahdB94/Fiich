'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function InvitationsBadge() {
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchPendingInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setPendingCount(0)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('invitations')
        .select('id, expires_at')
        .eq('invited_email', user.email)

      if (error) {
        console.error('Erreur lors de la récupération des invitations:', error)
        setPendingCount(0)
      } else {
        // Filtrer les invitations non expirées
        const validInvitations = data.filter(invitation => 
          new Date(invitation.expires_at) > new Date()
        )
        setPendingCount(validInvitations.length)
      }
    } catch (err) {
      console.error('Erreur:', err)
      setPendingCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingInvitations()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPendingInvitations()
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return null
  }

  if (pendingCount === 0) {
    return null
  }

  return (
    <Link href="/invitations">
      <Badge variant="destructive" className="cursor-pointer hover:bg-destructive/90">
        <Mail className="h-3 w-3 mr-1" />
        {pendingCount} invitation{pendingCount > 1 ? 's' : ''} en attente
      </Badge>
    </Link>
  )
} 