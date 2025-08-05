'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { useNotifications } from '@/hooks/use-notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, Trash2, CheckCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const { notifications, loading, error, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markAsRead(notificationId)
    if (success) {
      toast.success('Notification marquée comme lue')
    }
  }

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead()
    if (success) {
      toast.success('Toutes les notifications marquées comme lues')
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    const success = await deleteNotification(notificationId)
    if (success) {
      toast.success('Notification supprimée')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'company_updated':
        return '🏢'
      case 'document_added':
        return '📄'
      case 'document_deleted':
        return '🗑️'
      case 'document_updated':
        return '✏️'
      default:
        return '🔔'
    }
  }

  const getNotificationLink = (notification: any) => {
    switch (notification.notification_type) {
      case 'company_updated':
        return `/shared-companies/${notification.company_id}?highlight=changes`
      case 'document_added':
      case 'document_deleted':
      case 'document_updated':
        return `/shared-companies/${notification.company_id}?highlight=documents`
      default:
        return `/shared-companies/${notification.company_id}`
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'company_updated':
        return 'text-blue-600'
      case 'document_added':
        return 'text-green-600'
      case 'document_deleted':
        return 'text-red-600'
      case 'document_updated':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="text-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-full blur-xl opacity-20"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-600 p-4 rounded-full">
                  <Bell className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-900">Erreur de chargement</h3>
              <p className="text-red-800 mb-6 max-w-md mx-auto">
                Une erreur s'est produite lors du chargement des notifications.
              </p>
              <Button asChild className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white">
                <Link href="/dashboard">
                  Retour au tableau de bord
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                Restez informé des modifications de vos entreprises partagées
              </p>
            </div>
            
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline">
                <CheckCheck className="mr-2 h-4 w-4" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Check className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Non lues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Lues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des notifications */}
        {notifications.length === 0 ? (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="text-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                  <Bell className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-900">Aucune notification</h3>
              <p className="text-blue-800 mb-6 max-w-md mx-auto">
                Vous n'avez pas encore de notifications. Elles apparaîtront ici quand des modifications seront apportées aux entreprises que vous partagez.
              </p>
              <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                <Link href="/shared-companies">
                  Voir mes entreprises partagées
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={`transition-all duration-200 ${!notification.is_read ? 'border-blue-200 bg-blue-50/50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getNotificationIcon(notification.notification_type)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`font-semibold ${getNotificationColor(notification.notification_type)}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              Non lue
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <Button asChild size="sm" variant="outline">
                          <Link href={getNotificationLink(notification)}>
                            Voir les détails
                          </Link>
                        </Button>
                        
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Marquer comme lue
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
} 