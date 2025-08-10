'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Star } from 'lucide-react'
import { Plan } from '@/lib/types'

interface PlanCardProps {
  plan: Plan
  isCurrentPlan?: boolean
  onSelect?: (plan: Plan) => void
  className?: string
}

export function PlanCard({ plan, isCurrentPlan = false, onSelect, className = '' }: PlanCardProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const getPlanIcon = () => {
    if (plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('pro')) {
      return <Crown className="h-6 w-6 text-yellow-500" />
    }
    if (plan.name.toLowerCase().includes('starter') || plan.name.toLowerCase().includes('basic')) {
      return <Star className="h-6 w-6 text-blue-500" />
    }
    return <Star className="h-6 w-6 text-gray-500" />
  }

  const getPlanColor = () => {
    if (plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('pro')) {
      return 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50'
    }
    if (plan.name.toLowerCase().includes('starter') || plan.name.toLowerCase().includes('basic')) {
      return 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50'
    }
    return 'border-gray-300 bg-white'
  }

  return (
    <Card className={`relative ${getPlanColor()} ${className}`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            Plan actuel
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2">
          {getPlanIcon()}
        </div>
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prix */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {formatPrice(plan.price, plan.currency)}
          </div>
          <div className="text-sm text-gray-500">
            par {plan.billing_cycle === 'monthly' ? 'mois' : 'an'}
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900">Fonctionnalités incluses :</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Limites */}
        <div className="space-y-2 text-sm text-gray-600">
          {plan.max_companies && (
            <div className="flex justify-between">
              <span>Entreprises max :</span>
              <span className="font-medium">{plan.max_companies}</span>
            </div>
          )}
          {plan.max_documents && (
            <div className="flex justify-between">
              <span>Documents max :</span>
              <span className="font-medium">{plan.max_documents}</span>
            </div>
          )}
          {plan.max_storage_gb && (
            <div className="flex justify-between">
              <span>Stockage :</span>
              <span className="font-medium">{plan.max_storage_gb} GB</span>
            </div>
          )}
        </div>

        {/* Bouton d'action */}
        {onSelect && (
          <Button
            onClick={() => onSelect(plan)}
            className="w-full"
            variant={isCurrentPlan ? 'outline' : 'default'}
            disabled={isCurrentPlan}
          >
            {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
