import { useState, useMemo, useCallback } from 'react'
import { SearchFilters } from '@/components/ui/search-input'

interface UseSearchOptions<T> {
  data: T[]
  searchFields: (keyof T)[]
  filterFields?: {
    [K in keyof T]?: {
      label: string
      getValue: (item: T) => string
      getLabel: (item: T) => string
    }
  }
  sortOptions?: {
    label: string
    value: string
    sortFn: (a: T, b: T) => number
  }[]
}

export function useSearch<T>({
  data,
  searchFields,
  filterFields = {},
  sortOptions = []
}: UseSearchOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('')

  // Générer les filtres disponibles
  const availableFilters = useMemo(() => {
    const filters: SearchFilters = {}
    
    Object.entries(filterFields).forEach(([field, config]) => {
      if (!config || typeof config !== 'object' || !('getValue' in config) || !('getLabel' in config)) return
      
      const typedConfig = config as {
        getValue: (item: any) => string
        getLabel: (item: any) => string
      }
      
      const values = new Map<string, { label: string; count: number }>()
      
      data.forEach(item => {
        const value = typedConfig.getValue(item as any)
        const label = typedConfig.getLabel(item as any)
        
        if (values.has(value)) {
          values.get(value)!.count++
        } else {
          values.set(value, { label, count: 1 })
        }
      })
      
      filters[field] = Array.from(values.entries()).map(([value, { label, count }]) => ({
        id: `${field}:${value}`,
        label,
        value,
        count
      }))
    })
    
    return filters
  }, [data, filterFields])

  // Filtrer les données
  const filteredData = useMemo(() => {
    let result = [...data]

    // Recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field]
          return value && String(value).toLowerCase().includes(query)
        })
      )
    }

    // Filtres
    if (selectedFilters.length > 0) {
      result = result.filter(item => {
        return selectedFilters.every(filterId => {
          const [field, value] = filterId.split(':')
          const config = filterFields[field as keyof T]
          if (!config || typeof config !== 'object' || !('getValue' in config)) return true
          
          const typedConfig = config as {
            getValue: (item: any) => string
          }
          
          return typedConfig.getValue(item as any) === value
        })
      })
    }

    // Tri
    if (sortBy) {
      const sortOption = sortOptions.find(option => option.value === sortBy)
      if (sortOption) {
        result.sort(sortOption.sortFn)
      }
    }

    return result
  }, [data, searchQuery, selectedFilters, sortBy, searchFields, filterFields, sortOptions])

  // Statistiques
  const stats = useMemo(() => ({
    total: data.length,
    filtered: filteredData.length,
    hasFilters: selectedFilters.length > 0,
    hasSearch: searchQuery.trim().length > 0
  }), [data.length, filteredData.length, selectedFilters.length, searchQuery])

  // Actions
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSelectedFilters([])
    setSortBy('')
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedFilters([])
  }, [])

  return {
    // État
    searchQuery,
    selectedFilters,
    sortBy,
    availableFilters,
    
    // Données filtrées
    filteredData,
    stats,
    
    // Actions
    setSearchQuery,
    setSelectedFilters,
    setSortBy,
    clearSearch,
    clearFilters
  }
} 