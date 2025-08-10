'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  Check, 
  Trash2, 
  CheckCheck,
  AlertCircle,
  Info,
  FileText,
  Building,
  Users
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNotifications } from '@/hooks/use-notifications'
import { Notification } from '@/lib/types'
import { toast } from 'sonner'

interface NotificationListProps {
  userId: string
  maxHeight?: string
}

export function NotificationList({ userId, maxHeight = '400px' }: NotificationListProps) {
  const { 
    notifications, 
    loading, 
    error, 
    unreadCount,
    markAsRead, 
    markAllAsRead, 
 
deleteNotification 
  } = useNotifications(userId)

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'invitation':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'document_shared':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'company_update':
        return <Building className="h-4 w-4 text-purple-500" />
      case 'system':
        return <Info className="h-4 w-4 text-gray-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'invitation':
        return 'bg-blue-50 border-blue-200'
      case 'document_shared':
        return 'bg-green-50 border-green-200'
      case 'company_update':
        return 'bg-purple-50 border-purple-200'
      case 'system':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
      toast.success('Notification marquée comme lue')
    } catch (error) {
      toast.error('Erreur lors du marquage')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('Toutes les notifications marquées comme lues')
    } catch (error) {
      toast.error('Erreur lors du marquage')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      toast.success('Notification supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            Erreur: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <CardDescription>
          Gérez vos notifications et invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune notification</p>
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.is_read 
                      ? 'bg-white' 
                      : getNotificationColor(notification.type)
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {format(new Date(notification.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                          {notification.company_id && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              ID: {notification.company_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
