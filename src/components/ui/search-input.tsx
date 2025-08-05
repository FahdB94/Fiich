'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface SearchFilter {
  id: string
  label: string
  value: string
  count?: number
}

export interface SearchFilters {
  [key: string]: SearchFilter[]
}

interface SearchInputProps {
  placeholder?: string
  value: string
  onValueChange: (value: string) => void
  filters?: SearchFilters
  selectedFilters?: string[]
  onFiltersChange?: (filters: string[]) => void
  className?: string
  showClearButton?: boolean
  onClear?: () => void
  loading?: boolean
}

export function SearchInput({
  placeholder = "Rechercher...",
  value,
  onValueChange,
  filters = {},
  selectedFilters = [],
  onFiltersChange,
  className,
  showClearButton = true,
  onClear,
  loading = false
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onValueChange('')
    if (onClear) onClear()
    inputRef.current?.focus()
  }

  const handleFilterToggle = (filterId: string) => {
    if (!onFiltersChange) return
    
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(f => f !== filterId)
      : [...selectedFilters, filterId]
    
    onFiltersChange(newFilters)
  }

  const getFilterLabel = (filterId: string) => {
    for (const category of Object.values(filters)) {
      const filter = category.find(f => f.id === filterId)
      if (filter) return filter.label
    }
    return filterId
  }

  const hasActiveFilters = selectedFilters.length > 0

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pl-10 pr-10",
            hasActiveFilters && "border-blue-200 bg-blue-50/50"
          )}
          disabled={loading}
        />
        
        {/* Bouton de filtres */}
        {Object.keys(filters).length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0",
                  hasActiveFilters && "text-blue-600"
                )}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Filtres</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {Object.entries(filters).map(([category, filterList]) => (
                <div key={category}>
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                    {category}
                  </DropdownMenuLabel>
                  {filterList.map((filter) => (
                    <DropdownMenuCheckboxItem
                      key={filter.id}
                      checked={selectedFilters.includes(filter.id)}
                      onCheckedChange={() => handleFilterToggle(filter.id)}
                      className="flex items-center justify-between"
                    >
                      <span>{filter.label}</span>
                      {filter.count !== undefined && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {filter.count}
                        </Badge>
                      )}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Bouton de suppression */}
        {showClearButton && (value || hasActiveFilters) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFilters.map((filterId) => (
            <Badge
              key={filterId}
              variant="secondary"
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
              onClick={() => handleFilterToggle(filterId)}
            >
              {getFilterLabel(filterId)}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange?.([])}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Effacer tous les filtres
          </Button>
        </div>
      )}
    </div>
  )
} 