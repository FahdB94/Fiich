'use client'

import { useState } from 'react'
import { Bell, Check, Trash2, Mail, Building, CheckCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useNotifications, UnifiedNotification } from '@/hooks/use-notifications'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

export function UnifiedNotificationBell() {
  const { 
    unifiedNotifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteInvitation 
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const notifications = unifiedNotifications.filter(n => n.type === 'notification')
  const invitations = unifiedNotifications.filter(n => n.type === 'invitation')
  const unreadNotifications = notifications.filter(n => !n.is_read)
  const unreadInvitations = invitations.filter(n => !n.is_read)

  const handleMarkAsRead = async (notification: UnifiedNotification) => {
    const success = await markAsRead(notification.id)
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

  const handleDelete = async (notification: UnifiedNotification) => {
    let success = false
    
    if (notification.type === 'notification') {
      success = await deleteNotification(notification.id)
    } else if (notification.type === 'invitation') {
      success = await deleteInvitation(notification.invitation_id!)
    }
    
    if (success) {
      toast.success('Élément supprimé')
    }
  }

  const getNotificationIcon = (notification: UnifiedNotification) => {
    if (notification.type === 'invitation') {
      return <Mail className="h-4 w-4 text-blue-600" />
    }
    
    // Pour les notifications d'entreprise
    const metadata = notification.metadata
    if (metadata?.updated_fields) {
      return <Building className="h-4 w-4 text-green-600" />
    }
    
    return <Bell className="h-4 w-4 text-orange-600" />
  }

  const getNotificationLink = (notification: UnifiedNotification) => {
    if (notification.type === 'invitation') {
      return `/invitation/${notification.invitation_token}`
    }
    
    switch (notification.metadata?.notification_type) {
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

  const getNotificationColor = (notification: UnifiedNotification) => {
    if (notification.type === 'invitation') {
      return 'text-blue-600'
    }
    
    const metadata = notification.metadata
    if (metadata?.notification_type) {
      switch (metadata.notification_type) {
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
    
    return 'text-gray-600'
  }

  const renderNotificationItem = (notification: UnifiedNotification) => (
    <div key={notification.id} className="flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <p className={`text-sm font-medium ${getNotificationColor(notification)}`}>
            {notification.title}
          </p>
          <div className="flex items-center gap-1 ml-2">
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                handleDelete(notification)
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {format(new Date(notification.created_at), 'dd MMM à HH:mm', { locale: fr })}
          </span>
          
          <div className="flex items-center gap-2">
            {!notification.is_read && notification.type === 'notification' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  handleMarkAsRead(notification)
                }}
                className="h-6 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Lu
              </Button>
            )}
            
            <Button asChild size="sm" variant="outline" className="h-6 px-2 text-xs hover:bg-primary hover:text-primary-foreground">
              <Link 
                href={getNotificationLink(notification)}
                onClick={() => {
                  if (!notification.is_read && notification.type === 'notification') {
                    handleMarkAsRead(notification)
                  }
                  setIsOpen(false)
                }}
              >
                {notification.type === 'invitation' ? 'Voir' : 'Détails'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 max-h-[600px] overflow-hidden" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between p-4 pb-2 border-b">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-6 px-2 text-xs hover:bg-muted"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center px-4 mb-2">
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="all" className="text-xs h-6">
                Tout ({unifiedNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs h-6">
                Modifications ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="invitations" className="text-xs h-6">
                Invitations ({invitations.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto px-2">
            <TabsContent value="all" className="mt-0">
              {unifiedNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                unifiedNotifications.map(renderNotificationItem)
              )}
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-0">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune modification</p>
                </div>
              ) : (
                notifications.map(renderNotificationItem)
              )}
            </TabsContent>
            
            <TabsContent value="invitations" className="mt-0">
              {invitations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune invitation</p>
                </div>
              ) : (
                invitations.map(renderNotificationItem)
              )}
            </TabsContent>
          </div>
        </Tabs>
        
        {unifiedNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="p-0">
              <Link href="/notifications" className="w-full text-center">
                <Button variant="ghost" size="sm" className="w-full h-10 hover:bg-muted">
                  Voir toutes les notifications
                </Button>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 