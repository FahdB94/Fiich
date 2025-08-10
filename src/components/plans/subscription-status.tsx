'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Crown
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCompanySubscription } from '@/hooks/use-plans'
import { toast } from 'sonner'

interface SubscriptionStatusProps {
  companyId: string
}

export function SubscriptionStatus({ companyId }: SubscriptionStatusProps) {
  const { 
    subscription, 
    loading, 
    error, 
    cancelSubscription, 
    reactivateSubscription 
  } = useCompanySubscription(companyId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'trial':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription()
      toast.success('Abonnement annulé à la fin de la période')
    } catch (error) {
      toast.error('Erreur lors de l\'annulation')
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      await reactivateSubscription()
      toast.success('Abonnement réactivé')
    } catch (error) {
      toast.error('Erreur lors de la réactivation')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Statut de l'abonnement
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
            <CreditCard className="h-5 w-5" />
            Statut de l'abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement de l'abonnement : {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Statut de l'abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Aucun abonnement actif</p>
            <Button>
              Choisir un plan
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isExpiringSoon = () => {
    if (subscription.status === 'active' && subscription.cancel_at_period_end) {
      const endDate = new Date(subscription.current_period_end)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 7
    }
    return false
  }

  const isInTrial = () => {
    if (subscription.status === 'trial' && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end)
      const now = new Date()
      return trialEnd > now
    }
    return false
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Statut de l'abonnement
        </CardTitle>
        <CardDescription>
          Gérez votre abonnement et vos facturations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut principal */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(subscription.status)}
            <div>
              <div className="font-medium">Statut</div>
              <Badge variant="secondary" className={getStatusColor(subscription.status)}>
                {subscription.status === 'active' ? 'Actif' : 
                 subscription.status === 'trial' ? 'Essai' :
                 subscription.status === 'cancelled' ? 'Annulé' :
                 subscription.status === 'expired' ? 'Expiré' : subscription.status}
              </Badge>
            </div>
          </div>
          {subscription.cancel_at_period_end && (
            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
              Annulé à la fin de la période
            </Badge>
          )}
        </div>

        {/* Informations de période */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Période actuelle</span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Début : {format(new Date(subscription.current_period_start), 'dd/MM/yyyy', { locale: fr })}</div>
              <div>Fin : {format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: fr })}</div>
            </div>
          </div>

          {subscription.trial_start && subscription.trial_end && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Période d'essai</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>Début : {format(new Date(subscription.trial_start), 'dd/MM/yyyy', { locale: fr })}</div>
                <div>Fin : {format(new Date(subscription.trial_end), 'dd/MM/yyyy', { locale: fr })}</div>
              </div>
            </div>
          )}
        </div>

        {/* Alertes */}
        {isExpiringSoon() && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Votre abonnement expire le {format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: fr })}. 
              Renouvelez-le pour continuer à profiter de nos services.
            </AlertDescription>
          </Alert>
        )}

        {isInTrial() && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Vous êtes en période d'essai jusqu'au {format(new Date(subscription.trial_end!), 'dd/MM/yyyy', { locale: fr })}. 
              Choisissez un plan pour continuer après cette date.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              className="flex-1"
            >
              Annuler l'abonnement
            </Button>
          )}
          
          {subscription.status === 'active' && subscription.cancel_at_period_end && (
            <Button
              onClick={handleReactivateSubscription}
              className="flex-1"
            >
              Réactiver l'abonnement
            </Button>
          )}

          <Button variant="outline" className="flex-1">
            Gérer la facturation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
