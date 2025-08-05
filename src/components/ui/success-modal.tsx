'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  actionLabel = "Continuer",
  onAction,
  autoClose = true,
  autoCloseDelay = 3000
}: SuccessModalProps) {
  console.log('🎯 SuccessModal render:', { isOpen, title, message })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose()
        }, autoCloseDelay)
        
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [isOpen, autoClose, autoCloseDelay])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 200) // Délai pour l'animation de fermeture
  }

  const handleAction = () => {
    if (onAction) {
      onAction()
    }
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay avec animation */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Modal avec animation */}
      <Card className={cn(
        "relative w-full max-w-md mx-4 transform transition-all duration-200",
        isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
      )}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Cercle de fond animé */}
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-green-500 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-2">{message}</p>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex gap-3">
            {onAction && (
              <Button 
                onClick={handleAction}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {actionLabel}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Fermer
            </Button>
          </div>
        </CardContent>
        
        {/* Bouton de fermeture en haut à droite */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute top-2 right-2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  )
} 