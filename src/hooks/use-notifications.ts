import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  recipient_email: string
  company_id: string
  notification_type: 'company_updated' | 'document_added' | 'document_deleted' | 'document_updated'
  title: string
  message: string
  metadata: any
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface Invitation {
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

export interface UnifiedNotification {
  id: string
  type: 'notification' | 'invitation'
  title: string
  message: string
  is_read: boolean
  created_at: string
  updated_at: string
  company_id?: string
  company_name?: string
  metadata?: any
  // Pour les invitations
  invitation_id?: string
  invitation_token?: string
  invited_by_email?: string
  invited_by_name?: string
  expires_at?: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [unifiedNotifications, setUnifiedNotifications] = useState<UnifiedNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error)
        setError('Erreur lors du chargement des notifications')
        return
      }

      setNotifications(data || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors du chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setInvitations([])
        return
      }

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          companies(company_name)
        `)
        .eq('invited_email', user.email)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des invitations:', error)
        setInvitations([])
        return
      }

      setInvitations(data || [])
    } catch (err) {
      console.error('Erreur lors du chargement des invitations:', err)
      setInvitations([])
    }
  }

  const mergeNotifications = () => {
    const unified: UnifiedNotification[] = []

    // Ajouter les notifications
    notifications.forEach(notification => {
      unified.push({
        id: `notification-${notification.id}`,
        type: 'notification',
        title: notification.title,
        message: notification.message,
        is_read: notification.is_read,
        created_at: notification.created_at,
        updated_at: notification.updated_at,
        company_id: notification.company_id,
        metadata: notification.metadata
      })
    })

    // Ajouter les invitations
    invitations.forEach(invitation => {
      unified.push({
        id: `invitation-${invitation.id}`,
        type: 'invitation',
        title: 'Nouvelle invitation',
        message: `Vous avez été invité à accéder à l'entreprise "${invitation.company_name || 'Entreprise'}" par ${invitation.invited_by_email}`,
        is_read: false, // Les invitations sont toujours considérées comme non lues
        created_at: invitation.created_at,
        updated_at: invitation.updated_at,
        company_id: invitation.company_id,
        company_name: invitation.company_name,
        invitation_id: invitation.id,
        invitation_token: invitation.invitation_token,
        invited_by_email: invitation.invited_by_email,
        invited_by_name: invitation.invited_by_name,
        expires_at: invitation.expires_at
      })
    })

    // Trier par date de création (plus récent en premier)
    unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    setUnifiedNotifications(unified)
    setUnreadCount(unified.filter(n => !n.is_read).length)
  }

  const markAsRead = async (notificationId: string) => {
    // Extraire le type et l'ID correctement
    const type = notificationId.startsWith('notification-') ? 'notification' : 
                 notificationId.startsWith('invitation-') ? 'invitation' : null
    const id = type ? notificationId.substring(type.length + 1) : notificationId
    
    if (type === 'notification') {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .eq('id', id)

        if (error) {
          console.error('Erreur lors de la mise à jour:', error)
          return false
        }

        // Mettre à jour l'état local
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id
              ? { ...notification, is_read: true, updated_at: new Date().toISOString() }
              : notification
          )
        )

        return true
      } catch (err) {
        console.error('Erreur:', err)
        return false
      }
    }
    
    return false
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('is_read', false)

      if (error) {
        console.error('Erreur lors de la mise à jour:', error)
        return false
      }

      // Mettre à jour l'état local
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          is_read: true,
          updated_at: new Date().toISOString()
        }))
      )

      return true
    } catch (err) {
      console.error('Erreur:', err)
      return false
    }
  }

  const deleteNotification = async (notificationId: string) => {
    // Extraire le type et l'ID correctement
    const type = notificationId.startsWith('notification-') ? 'notification' : 
                 notificationId.startsWith('invitation-') ? 'invitation' : null
    const id = type ? notificationId.substring(type.length + 1) : notificationId
    
    if (type === 'notification') {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Erreur lors de la suppression:', error)
          return false
        }

        // Mettre à jour l'état local
        const deletedNotification = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(n => n.id !== id))
        
        return true
      } catch (err) {
        console.error('Erreur:', err)
        return false
      }
    }
    
    return false
  }

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)

      if (error) {
        console.error('Erreur lors de la suppression:', error)
        return false
      }

      // Mettre à jour l'état local
      setInvitations(prev => prev.filter(n => n.id !== invitationId))
      
      return true
    } catch (err) {
      console.error('Erreur:', err)
      return false
    }
  }

  // Écouter les nouvelles notifications en temps réel
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications(prev =>
            prev.map(notification =>
              notification.id === updatedNotification.id
                ? updatedNotification
                : notification
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const deletedNotification = payload.old as Notification
          setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'invitations'
        },
        (payload) => {
          const newInvitation = payload.new as Invitation
          setInvitations(prev => [newInvitation, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'invitations'
        },
        (payload) => {
          const deletedInvitation = payload.old as Invitation
          setInvitations(prev => prev.filter(n => n.id !== deletedInvitation.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Fusionner les notifications quand les données changent
  useEffect(() => {
    mergeNotifications()
  }, [notifications, invitations])

  // Charger les données au montage
  useEffect(() => {
    fetchNotifications()
    fetchInvitations()
  }, [])

  return {
    notifications,
    invitations,
    unifiedNotifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    fetchInvitations,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteInvitation
  }
} 