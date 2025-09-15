'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'

interface CustomerFiltersProps {
  onSearch: (search: string) => void
  onLevelFilter: (level: string) => void
  onClearFilters: () => void
  searchValue: string
  levelValue: string
}

const levelOptions = [
  { value: 'ALL', label: 'Tüm Seviyeler' },
  { value: 'REGULAR', label: 'Normal' },
  { value: 'BRONZE', label: 'Bronz' },
  { value: 'SILVER', label: 'Gümüş' },
  { value: 'GOLD', label: 'Altın' },
  { value: 'PLATINUM', label: 'Platin' }
]

export function CustomerFilters({
  onSearch,
  onLevelFilter,
  onClearFilters,
  searchValue,
  levelValue
}: CustomerFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchValue)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(localSearch)
  }

  const hasActiveFilters = searchValue || (levelValue && levelValue !== 'ALL')

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
      <form onSubmit={handleSearchSubmit} className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Müşteri adı veya email ile ara..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      <div className="flex gap-2">
        <Select value={levelValue} onValueChange={onLevelFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Seviye filtrele" />
          </SelectTrigger>
          <SelectContent>
            {levelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={onClearFilters}
            title="Filtreleri temizle"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}