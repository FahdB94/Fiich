'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'

interface PaymentTermsInputProps {
  value: string[]
  onChange: (terms: string[]) => void
  disabled?: boolean
}

export function PaymentTermsInput({ value = [], onChange, disabled = false }: PaymentTermsInputProps) {
  const [newTerm, setNewTerm] = useState('')

  const addTerm = () => {
    if (newTerm.trim() && !value.includes(newTerm.trim())) {
      onChange([...value, newTerm.trim()])
      setNewTerm('')
    }
  }

  const removeTerm = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTerm()
    }
  }

  return (
    <div className="space-y-4">
      <Label>Conditions de paiement</Label>
      
      {/* Liste des conditions existantes */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((term, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {term}
              <button
                type="button"
                onClick={() => removeTerm(index)}
                disabled={disabled}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Ajout d'une nouvelle condition */}
      <div className="flex gap-2">
        <Input
          placeholder="Ex: Paiement à 30 jours, Paiement comptant..."
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTerm}
          disabled={disabled || !newTerm.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions */}
      <div className="text-sm text-muted-foreground">
        <p>Suggestions :</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {['Paiement comptant', 'Paiement à 30 jours', 'Paiement à 45 jours', 'Paiement à 60 jours', 'Paiement à réception'].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                if (!value.includes(suggestion)) {
                  onChange([...value, suggestion])
                }
              }}
              disabled={disabled || value.includes(suggestion)}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 