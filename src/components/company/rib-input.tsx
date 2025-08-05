import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface RIBInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function RIBInput({ value, onChange, error, className, placeholder = "FR7630001007941234567890185", disabled }: RIBInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  // Fonction pour formater le RIB avec des espaces tous les 4 caractères
  const formatRIB = (input: string): string => {
    // Supprimer tous les espaces et caractères non alphanumériques
    const cleaned = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    // Ajouter un espace tous les 4 caractères
    return cleaned.replace(/(.{4})/g, '$1 ').trim()
  }

  // Fonction pour nettoyer le RIB (supprimer les espaces)
  const cleanRIB = (input: string): string => {
    return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  }

  // Mettre à jour l'affichage quand la valeur change
  useEffect(() => {
    setDisplayValue(formatRIB(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const cleanedValue = cleanRIB(inputValue)
    
    // Limiter à 28 caractères (format IBAN français étendu)
    if (cleanedValue.length <= 28) {
      onChange(cleanedValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permettre seulement les lettres, chiffres, espaces, backspace, delete, flèches
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Tab', 'Enter', 'Home', 'End'
    ]
    
    const isAllowedKey = allowedKeys.includes(e.key)
    const isAlphanumeric = /^[A-Za-z0-9\s]$/.test(e.key)
    
    if (!isAllowedKey && !isAlphanumeric) {
      e.preventDefault()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="rib">RIB (IBAN)</Label>
      <Input
        id="rib"
        type="text"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'font-mono tracking-wider',
          error && 'border-red-500 focus:border-red-500'
        )}
        disabled={disabled}
        maxLength={33} // 28 caractères + 5 espaces
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Format attendu : FR76 3000 1007 9412 3456 7890 185 (27 caractères) ou format étendu (28 caractères)
      </p>
    </div>
  )
} 