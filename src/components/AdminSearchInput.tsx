"use client"

import React, { useState, useRef, useCallback, memo } from 'react'
import { Input } from '@/components/ui/input'
import { Film, Loader2 } from 'lucide-react'

interface AdminSearchInputProps {
  onSearch: (query: string) => void
  isLoading?: boolean
  placeholder?: string
}

const AdminSearchInput = memo(function AdminSearchInput({ 
  onSearch, 
  isLoading = false, 
  placeholder = "Film, yönetmen veya harddisk ara..." 
}: AdminSearchInputProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
  }, [onSearch])

  return (
    <div className="relative">
      <Film className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#feca57] z-10" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="pl-10 pr-10 bg-white/10 border-white/20 focus:border-[#feca57] focus:ring-1 focus:ring-[#feca57] text-sm"
        disabled={isLoading}
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#feca57] animate-spin" />
      )}
    </div>
  )
})

export default AdminSearchInput