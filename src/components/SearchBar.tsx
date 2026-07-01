"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2 } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  isLoading?: boolean
  defaultValue?: string
  className?: string
  iconColor?: string
}

export default function SearchBar({ onSearch, placeholder = "Film adı veya yönetmene göre ara...", isLoading = false, defaultValue = "", className = "", iconColor = "text-muted-foreground" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const preventFocusLoss = useRef(false)

  useEffect(() => {
    if (defaultValue !== query && !preventFocusLoss.current) {
      setQuery(defaultValue)
    }
  }, [defaultValue, query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleClear = () => {
    setQuery("")
    onSearch("")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    preventFocusLoss.current = true
    setQuery(value)
    onSearch(value)
    
    setTimeout(() => {
      preventFocusLoss.current = false
    }, 100)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2 w-full">
      <div className="relative flex-1">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${iconColor}`} />
        <Input 
          ref={inputRef}
          type="text" 
          placeholder={placeholder} 
          value={query} 
          onChange={handleChange} 
          className={`pl-10 pr-10 ${className}`} 
          disabled={isLoading}
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#feca57] animate-spin" />
        ) : query ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        ) : null}
      </div>
    </form>
  )
}
