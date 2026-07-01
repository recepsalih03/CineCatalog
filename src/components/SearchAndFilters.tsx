"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import SearchBar from "@/components/SearchBar"
import HardDriveFilter from "@/components/HardDriveFilter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, HardDrive } from "lucide-react"

interface SearchAndFiltersProps {
  hardDrives: string[]
}

export default function SearchAndFilters({ hardDrives }: SearchAndFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "")
  const [selectedHardDrive, setSelectedHardDrive] = useState<string | undefined>(
    searchParams.get('hardDrive') || undefined
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    updateURL(query, selectedHardDrive)
  }

  const handleHardDriveSelect = (hardDrive: string | undefined) => {
    setSelectedHardDrive(hardDrive)
    updateURL(searchQuery, hardDrive)
  }

  const updateURL = (search: string, hardDrive: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    
    if (hardDrive) {
      params.set('hardDrive', hardDrive)
    } else {
      params.delete('hardDrive')
    }
    
    params.delete('page')
    
    const queryString = params.toString()
    router.replace(queryString ? `/?${queryString}` : '/', { scroll: false })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedHardDrive(undefined)
    router.replace('/', { scroll: false })
  }

  return (
    <Card className="search-card mb-6 lg:mb-10 border-0">
      <CardContent className="pt-6 pb-6 lg:pt-8 lg:pb-8">
        <div className="flex flex-col gap-3 lg:gap-6 mb-4 lg:mb-6">
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-[#feca57]" />
              <SearchBar onSearch={handleSearch} isLoading={false} defaultValue={searchQuery} />
            </div>
          </div>
          <div className="w-full">
            <HardDriveFilter
              hardDrives={hardDrives}
              selectedHardDrive={selectedHardDrive}
              onSelect={handleHardDriveSelect}
            />
          </div>
        </div>

        {(searchQuery || selectedHardDrive) && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[#feca57] font-medium">🎯 Aktif filtreler:</span>
            {searchQuery && (
              <Badge className="bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30 gap-2">
                <Search className="h-3 w-3" />
                Arama: {searchQuery}
              </Badge>
            )}
            {selectedHardDrive && (
              <Badge className="bg-[#feca57]/20 text-[#feca57] border-[#feca57]/30 gap-2">
                <HardDrive className="h-3 w-3" />
                Harddisk: {selectedHardDrive}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-3 text-xs hover:bg-red-500/20 hover:text-red-400">
              ✕ Tümünü temizle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}